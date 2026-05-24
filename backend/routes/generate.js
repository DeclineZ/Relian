import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse-debugging-disabled';
import { v4 as uuid } from 'uuid';
import fetchImage from './fetchImage.js';
import { Groq } from 'groq-sdk';
import { customRateLimiter } from '../middleware/limiter.js';
import { chunkText, mapReduceConcepts, SYS_UNIFIED_PROMPT } from '../lib/pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const groq = new Groq();


const generateLimiter = customRateLimiter(5, 60 * 60 * 1000); // 5 requests per hour
const queryLimiter = customRateLimiter(60, 60 * 1000); // 60 requests per minute

const uploadDir = os.tmpdir();

const upload = multer({ 
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'), false);
    }
    cb(null, true);
  }
});

const uploadSinglePdf = (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const JSON_PATH = path.resolve(__dirname, '../decks.json');
const loadDecks = () => JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const saveDecks = (data) => {
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Could not save decks to decks.json (possibly read-only filesystem):', err.message);
  }
};


const todayIso = () => new Date().toISOString().slice(0, 10);

// === System Prompts ===

const SYS_EXPLANATION = {
  role: 'system',
  content: `You are an expert educator fluent in Thai.  
When I send you a flashcard Q&A, provide a concise (≤2 paragraphs) explanation in Thai that clarifies *why* the answer is correct, without repeating it.  
Use simple, precise educational language.`
};

const SYS_RELATED = {
  role: 'system',
  content: `You are an expert educator.  
From a single input flashcard, generate follow-up flashcards in Thai using Bloom's Taxonomy.  
Output only a JSON array of objects { question, answer, keyword, needs_image }, no extra text.  
Use a keyword only when needs_image is true.
Don't output any code fences`
};

// === Code Fences ===

function stripCodeFences(text) {
  return text
    .replace(/```mermaid\s*\n?/gi, '')
    .replace(/```json?\s*\n?/gi, '')
    .replace(/```\s*$/g, '')
    .trim();
}

// === Mermaid DSL Validation ===

function isCompleteDSL(dsl) {
  const quoteCount = (dsl.match(/"/g) || []).length;
  const openBr = (dsl.match(/\[/g) || []).length;
  const closeBr = (dsl.match(/\]/g) || []).length;
  const endsOpen = /\[\s*$/.test(dsl);
  return quoteCount % 2 === 0 && openBr === closeBr && !endsOpen;
}

// === Mermaid DSL Sanitization ===

function sanitizeMermaid(dsl) {
  const lines = dsl.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const balance = (lines.join('\n').match(/\[/g) || []).length - (lines.join('\n').match(/\]/g) || []).length;
    if (balance === 0) {
      break;
    }
    lines.pop();
  }
  return lines.join('\n');
}

// === Generate Deck Endpoint ===

// === Generate Deck Endpoint ===

router.post('/generate-deck', generateLimiter, uploadSinglePdf, async (req, res) => {
  try {
    if (!req.file) throw new Error('No PDF uploaded');

    // === PDF-Parse ===
    const buffer = fs.readFileSync(req.file.path);
    const { text } = await pdf(buffer);
    const rawText = text || '';

    // === Chunking and Map-Reduce (for long text) ===
    let inputSource = '';
    if (rawText.length > 15000) {
      console.log(`PDF text length (${rawText.length}) exceeds 15,000 chars. Running Map-Reduce chunking pipeline...`);
      const chunks = chunkText(rawText, 10000, 1000);
      inputSource = await mapReduceConcepts(chunks, groq);
    } else {
      inputSource = rawText;
    }

    // === Learning Preferences ===
    let prefs = {};
    try {
      prefs = JSON.parse(req.body.learningPrefs || '{}');
      if (typeof prefs !== 'object' || prefs === null || Array.isArray(prefs)) {
        prefs = {};
      }
    } catch {
      prefs = {};
    }

    const w = Object.entries(prefs)
      .map(([k, v]) => `${k}:${(v * 100).toFixed(0)}%`)
      .join(', ');
    const userPrefsPrompt = w ? `Learning preference weights (prioritize types of cards accordingly): ${w}` : '';

    // === Unified Generation LLM Call ===
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYS_UNIFIED_PROMPT },
        { role: 'user', content: `${userPrefsPrompt}\n\nSTUDY TEXT:\n${inputSource}` }
      ],
      max_tokens: 35000,
      "reasoning_effort": "medium",
    });

    const rawResult = stripCodeFences(response.choices[0].message.content.trim());

    // === Robust Unified JSON Parsing & Recovery ===
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (err) {
      console.warn('JSON parsing failed. Attempting regex cleanup recovery...', err.message);
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error('LLM did not return a valid parseable JSON payload.');
        }
      } else {
        throw new Error('LLM did not return a valid JSON payload.');
      }
    }

    // === Extract & Validate Assets ===
    const rawCards = Array.isArray(parsedResult.cards) ? parsedResult.cards.slice(0, 10) : [];
    const quizItems = Array.isArray(parsedResult.quiz) ? parsedResult.quiz.slice(0, 5) : [];
    let diagramDsl = parsedResult.diagramDsl || '';

    if (diagramDsl && !/^graph\s+(LR|RL|TB|BT)\b/.test(diagramDsl)) {
      console.warn('Mermaid diagram invalid syntax, dropping:', diagramDsl);
      diagramDsl = '';
    }
    if (diagramDsl) {
      diagramDsl = sanitizeMermaid(diagramDsl);
    }

    // === Hydrate Cards with Images and Metadata ===
    async function hydrateCard(c) {
      const img = c.needs_image ? await fetchImage(c.keyword) : null;
      return {
        id: uuid(),
        question: c.question || '',
        answer: c.answer || '',
        keyword: c.keyword || '',
        needs_image: !!c.needs_image,
        image: img,
        taxonomy: c.taxonomy || 'Remembering',
        point: 0,
        repetitions: 0,
        interval: 0,
        ef: 2.5,
        due: todayIso(),
      };
    }

    const cards = await Promise.all(rawCards.map(hydrateCard));

    // === Build Final Deck Object ===
    const newDeck = {
      id: uuid(),
      name: parsedResult.title || '🏷️ Study Deck',
      description: parsedResult.description || '',
      studied: false,
      total: cards.length,
      learned: 0,
      due: cards.length,
      cards,
      summaryHtml: parsedResult.summaryHtml || '',
      quiz: quizItems
    };

    if (diagramDsl) {
      newDeck.summaryHtml += `\n<div class="mermaid">\n${diagramDsl}\n</div>`;
    }

    const decks = loadDecks();
    decks.push(newDeck);
    saveDecks(decks);

    res.json(newDeck);
  } catch (err) {
    console.error('generate-deck error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, () => { });
    }
  }
});

// === Explanation Endpoint ===

router.post('/explanation', queryLimiter, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Missing question or answer." });
    }
    if (
      typeof question !== 'string' || question.length > 1000 ||
      typeof answer !== 'string' || answer.length > 1000
    ) {
      return res.status(400).json({ error: "Invalid or oversized input parameters." });
    }


    const userExplain = {
      role: 'user',
      content: `Flashcard Question: ${question}\nFlashcard Answer: ${answer}`
    };

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [SYS_EXPLANATION, userExplain],
      max_tokens: 250,
      temperature: 0.2
    });


    const explanation = response.choices[0].message.content.trim();
    res.json({ explanation });
  } catch (err) {
    console.error('AI explanation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === Deck Summary GET Endpoint ===

router.get('/summarize-deck/:id', (req, res) => {
  const decks = loadDecks();
  const deck = decks.find(d => d.id === req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  return res.json({ summaryHtml: deck.summaryHtml || '' });
});



// === Related Cards Endpoint ===

router.post('/related-cards', queryLimiter, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer)
      return res.status(400).json({ error: 'Missing question or answer' });
    if (
      typeof question !== 'string' || question.length > 1000 ||
      typeof answer !== 'string' || answer.length > 1000
    ) {
      return res.status(400).json({ error: "Invalid or oversized input parameters." });
    }

    const userRelated = {
      role: 'user',
      content: `flashcard ต้นฉบับ:\nQ: ${question}\nA: ${answer}`
    };

    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [SYS_RELATED, userRelated],
      max_tokens: 1200,
      temperature: 0.6
    });

    let raw;
    try { raw = JSON.parse(resp.choices[0].message.content.normalize('NFC')); }
    catch { throw new Error('LLM did not return valid JSON'); }

    if (Array.isArray(raw)) {
      raw = raw.slice(0, 10);
    } else if (raw.cards && Array.isArray(raw.cards)) {
      raw = raw.cards.slice(0, 10);
    } else {
      throw new Error('LLM did not return an array');
    }

    const cards = await Promise.all(raw.map(hydrateCard));

    res.json({ cards });
  } catch (err) {
    console.error('related-cards error:', err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
