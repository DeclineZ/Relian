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

const SYS_GENERATE = {
  role: 'system',
  content: `When I send you a chunk of Thai text, your job is to output only a single valid JSON object (no markdown, no code fences, no extra commentary) using the schema below, and follow the instructions carefully to generate comprehensive flashcards:
maximize learning efficiency and ensure complete content coverage.
{
  "title":       "🏷️ ชื่อสั้น ๆ เป็นภาษาไทย",
  "description": "คำอธิบายสั้น ๆ เป็นภาษาไทย",
  "cards": [
    {
      "question":    "<คำถามภาษาไทย>",
      "answer":      "<คำตอบภาษาไทย>",
      "needs_image": <true|false>,
      "keyword":     "<1-3 English words>",
      "taxonomy":    "Remembering"|"Understanding"|"Applying"
    },
    …
  ]
}
Instructions & Rules
Goal: Create flashcards that cover all key concepts, definitions, and applications found in the input Thai text using Bloom’s Taxonomy.
Generate up to 10 flashcards (maximum 10). Do not generate more than 10 under any circumstances.
Title: Begin with an emoji, followed by a short and clear Thai title summarizing the theme.
Description: One sentence in Thai describing the purpose of the flashcard deck.
Card Generation:
Generate multiple flashcards per Bloom level where possible.
Ensure every major point, idea, or concept from the input is covered at least once.
Focus on clarity and variety in question types across Bloom levels.
needs_image:
Set to true only if a visual aid would significantly enhance understanding.
When true, provide 1-3 relevant English keywords for the image (e.g., "Thai flag", "voting booth").
When false, use empty string "".
taxonomy:
Use "Remembering" for simple factual recall (e.g., dates, names, definitions).
Use "Understanding" for concept interpretation or explanation.
Use "Applying" for scenario-based or real-world use cases that require learners to use what they've learned.
Output:
Raw JSON only.
Use double quotes for all strings.
Do not include any markdown formatting, explanations, or extra text.
`
};

const SYS_QUIZ = {
  role: 'system',
  content: `You are an expert Thai educator.

For the passage of Thai study text I send you, create open-ended questions that require a written answer.

Generate up to 5 questions (maximum 5). Do not generate more than 5 under any circumstances.

Return ONLY raw JSON in this schema:

[
  {
    "question": "<string>",
    "answer":   "<ideal answer in 2-3 sentences>",
    "key_points": ["<core point 1>", "<core point 2>", "..."]
  },
  ...
]

Rules:
- key_points = 2-6 short phrases that must appear
  (semantically) in any fully correct answer.
- Do NOT output prose, markdown, or code fences.
`
};

const SYS_SUMMARY = {
  role: 'system',
  content: `You are an expert educational writer, fluent in Thai, crafting effective and engaging summaries for learners.

When I send you a chunk of Thai text, output **only** a self-contained HTML fragment—no markdown, no code fences, no additional commentary. Structure your summary using exactly these elements and classes:

  1. Page title  
     <h1 class="main-title">…</h1>

  2. Section headings (use one or more as needed)  
     <h2 class="section-heading">…</h2>

  3. Key points list
     <ul class="key-points">
       <li class="list-item">…</li>
       …
     </ul>

  4. Important terms (wrap only terms, not full sentences)  
     <strong class="important-term">…</strong>

  5. Emphasis notes (use sparingly for definitions or asides)  
     <em class="emphasis-note">…</em>

  6. Paragraph Text, Explanations, etc.
    <p>...</p>

**Additional styling rules:** 
- Use plain text inside the tags—no inline styles, no other attributes.  
- Preserve any Thai punctuation and diacritics exactly.  
- Do not wrap your HTML in '<html>', '<body>', or '<div>'—just output the fragment.

**Example output:**

<h1 class="main-title">การเปลี่ยนแปลงสภาพภูมิอากาศ</h1>
<h2 class="section-heading">ผลกระทบต่อเกษตรกรรม</h2>
<ul class="key-points">
  <li class="list-item">ความไม่แน่นอนของปริมาณน้ำฝน</li>
  <li class="list-item">อุณหภูมิเพิ่มขึ้นกดทับผลผลิต</li>
  <li class="list-item">ศัตรูพืชแพร่ระบาดรวดเร็ว</li>
</ul>
<p>คำว่า <strong class="important-term">การทำให้แห้ง</strong> หมายถึงการสูญเสียน้ำในดิน...</p>
<em class="emphasis-note">หมายเหตุ: ข้อมูลนี้อิงจากรายงานปี 2024</em>
`

};

const SYS_DIAGRAM = {
  role: 'system',
  content: `You are an expert educational diagram generator, fluent in Thai. Your goal is to turn any given Thai text into a clear, concise Mermaid flowchart that helps students grasp the concepts visually.

When I send you a passage, output **only** the raw Mermaid DSL—no HTML, no markdown, no code fences. Follow these rules exactly:

1. **Direction**: Always start with 'graph LR' (left-to-right).
2. **Node IDs**: Use simple ASCII IDs only ('A, B, C…' or 'Node1, Node2…').
3. **Labels**: Put Thai text inside the brackets, e.g. A["หินดินแร่"]
4. **Edges**: Represent relationships with '-->' (e.g. 'A --> B').
5. **Completeness**: Never truncate mid-line; ensure every '["…"]' is closed.
6. **No extras**: Do not emit any comments, titles, or non-DSL text.

**Example**  
graph LR
A["สภาพภูมิอากาศ"] --> B["ผลกระทบต่อเกษตรกรรม"]
B --> C["ความไม่แน่นอนของน้ำฝน"]
B --> D["อุณหภูมิเพิ่มสูง"]
`
};

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

router.post('/generate-deck', generateLimiter, uploadSinglePdf, async (req, res) => {
  try {


    if (!req.file) throw new Error('No PDF uploaded');

    // === PDF-Parse ===

    const buffer = fs.readFileSync(req.file.path);
    const { text } = await pdf(buffer);
    const sanitizedText = (text || '').substring(0, 15000);

    const userGenerate = {
      role: 'user',
      content: `\n${sanitizedText}\n-`
    };

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

    // === Turn Parsed prefs into % Weights ===

    const w = Object.entries(prefs)
      .map(([k, v]) => `${k}:${(v * 100).toFixed(0)}%`)
      .join(', ');
    const SYS_PREFS = {
      role: 'system',
      content: `Weight preferences: ${w}. Please prioritize images, real-world examples, logic, or text accordingly, But also generate some of the other types of cards in the deck while prioritizing the weights.`
    };

    // === Flashcard Generation LLM ===

    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [SYS_PREFS, SYS_GENERATE, userGenerate],
      max_tokens: 35000,
      "reasoning_effort": "medium",
    });

    const rawDeck = stripCodeFences(response.choices[0].message.content);

    // === Flashcard Output ===

    let deckRaw;
    try {
      deckRaw = JSON.parse(rawDeck);
      if (deckRaw && deckRaw.cards && Array.isArray(deckRaw.cards)) {
        deckRaw.cards = deckRaw.cards.slice(0, 10);
      }
    } catch (e) {
      console.error('Invalid model response (after stripping):', rawDeck);
      throw new Error('Model did not return valid JSON');
    }

    // === Hydrate Cards with Images and Metadata ===

    async function hydrateCard(c) {
      const img = c.needs_image ? await fetchImage(c.keyword) : null;
      return {
        id: uuid(),
        question: c.question,
        answer: c.answer,
        keyword: c.keyword,
        needs_image: c.needs_image,
        image: img,
        ...(c.taxonomy && { taxonomy: c.taxonomy }),
        point: 0,
        repetitions: 0,
        interval: 0,
        ef: 2.5,
        due: todayIso(),
      };
    }

    // === Create New Deck Object ===

    const cards = await Promise.all(deckRaw.cards.map(hydrateCard));

    const decks = loadDecks();
    const newDeck = {
      id: uuid(),
      name: deckRaw.title,
      description: deckRaw.description,
      studied: false,
      total: cards.length,
      learned: 0,
      due: cards.length,
      cards
    };

    // === Generate Summary HTML ===

    const summaryUser = {
      role: 'user',
      content: `BEGIN RAW TEXT\n${sanitizedText}\nEND RAW TEXT`
    };

    const sumResp = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      messages: [SYS_SUMMARY, summaryUser],
      max_tokens: 1800,
    });
    newDeck.summaryHtml = sumResp.choices[0].message.content.trim();

    // === Generate Mermaid Diagram & Validation ===

    let diagramDsl = '';
    try {
      diagramDsl = await generateDiagram(sanitizedText);
      if (!/^graph\s+(LR|RL|TB|BT)\b/.test(diagramDsl)) {
        console.warn('Diagram DSL invalid, dropping it:', diagramDsl);
        diagramDsl = '';
      }
    } catch (err) {
      console.warn('Diagram generation failed:', err);
    }

    // === Add Diagram into Summary ===

    if (diagramDsl) {
      newDeck.summaryHtml += `\n<div class="mermaid">\n${diagramDsl}\n</div>`;
    }

    let html = newDeck.summaryHtml;

    const MERMAID_RE = /<div\s+class="mermaid">\s*([\s\S]*?)\s*<\/div>/g;

    let match;
    let cleanHtml = html;

    // === Final Mermaid Diagram Validization ===

    while ((match = MERMAID_RE.exec(html)) !== null) {
      const dsl = match[1].trim();
      if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)\b/.test(dsl)) {
        cleanHtml = cleanHtml.replace(match[0], '');
      }
    }

    newDeck.summaryHtml = cleanHtml;

    // === Generate Quiz Questions ===

    const quizUser = {
      role: 'user',
      content: `BEGIN RAW TEXT
${sanitizedText}
END RAW TEXT`
    };

    let quizItems = [];
    try {
      const quizResp = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [SYS_QUIZ, quizUser],
        "reasoning_effort": "medium",
        max_tokens: 6000,
      });

      const raw = stripCodeFences(quizResp.choices[0].message.content.trim());
      quizItems = JSON.parse(raw);
      if (!Array.isArray(quizItems)) quizItems = [];
      quizItems = quizItems.slice(0, 5);
    } catch (err) {
      console.warn('Quiz generation failed:', err);
      quizItems = [];
    }

    newDeck.quiz = quizItems;

    decks.push(newDeck);
    saveDecks(decks);

    // === Send Response & Cleanup ===
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
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

// === Diagram Generation Function ===

async function generateDiagram(text) {
  const userMsg = { role: 'user', content: `=== INPUT TEXT ===\n${text}\n=== END INPUT ===` };
  let resp = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [SYS_DIAGRAM, userMsg],
    max_tokens: 1024,
    temperature: 0.6,
    "reasoning_effort": "low",
  });

  let dsl = stripCodeFences(resp.choices[0].message.content.normalize('NFC'));

  // === LLM Check for Mermaid Diagram Completeness ===

  if (!isCompleteDSL(dsl)) {
    console.warn('Initial diagram DSL incomplete, attempting to finish it.');
    const tailPrompt = {
      role: 'user',
      content: `The Mermaid DSL below got cut off. Please _only_ continue from the last valid line, finishing any open labels or brackets. Do not repeat lines you already sent.\n\n\`\`\`mermaid\n${dsl}\n\`\`\``
    };
    const follow = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [SYS_DIAGRAM, tailPrompt],
      max_tokens: 100,
      "reasoning_effort": "none",
    });
    const more = stripCodeFences(follow.choices[0].message.content.normalize('NFC'));
    dsl = `${dsl}\n${more}`;
  }

  dsl = dsl
    .split('\n')
    .filter(line => !/\[\s*$/.test(line))
    .join('\n');

  dsl = sanitizeMermaid(dsl);

  return dsl.trim();
}

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
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
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
