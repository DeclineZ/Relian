import { Groq } from 'groq-sdk';

const SYS_EXTRACT = `You are an expert educator. Extract a clean list of the 5-7 most important key concepts, definitions, or critical facts from the provided Thai text. Return them as a flat JSON array of strings in Thai, like: ["concept 1", "concept 2", ...]. Return ONLY the raw JSON array. No markdown, no fences.`;

function stripCodeFences(text) {
  return text
    .replace(/```json?\s*\n?/gi, '')
    .replace(/```\s*$/g, '')
    .trim();
}

/**
 * Splits text into overlapping chunks
 */
export function chunkText(text, size = 10000, overlap = 1000) {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += (size - overlap);
  }
  return chunks;
}

/**
 * Extracts and consolidates concepts using a Map-Reduce approach
 */
export async function mapReduceConcepts(chunks, groq) {
  // Limit to max 5 chunks to avoid exceeding limits
  const activeChunks = chunks.slice(0, 5);
  
  const mapPromises = activeChunks.map(async (chunk) => {
    try {
      const resp = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYS_EXTRACT },
          { role: 'user', content: chunk }
        ],
        max_tokens: 800,
        temperature: 0.3
      });
      
      const raw = stripCodeFences(resp.choices[0].message.content.trim());
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('Chunk concept extraction failed:', err.message);
      return [];
    }
  });
  
  const allLists = await Promise.all(mapPromises);
  const combined = allLists.flat();
  
  if (combined.length === 0) return 'No key concepts found in the document.';
  
  try {
    const SYS_CONSOLIDATE = `You are an expert editor. Below is a list of educational concepts. Deduplicate, group, and merge similar items. Select and output the top 10-12 most important, unique concepts. Format them as a flat JSON array of strings in Thai. Return ONLY raw JSON, no code fences.`;
    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYS_CONSOLIDATE },
        { role: 'user', content: JSON.stringify(combined) }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });
    const raw = stripCodeFences(resp.choices[0].message.content.trim());
    const consolidated = JSON.parse(raw);
    return Array.isArray(consolidated) ? consolidated.join('\n') : combined.slice(0, 12).join('\n');
  } catch (err) {
    console.warn('Concepts consolidation failed, falling back to local slice:', err.message);
    return Array.from(new Set(combined)).slice(0, 12).join('\n');
  }
}

// Master unified generation prompt
export const SYS_UNIFIED_PROMPT = `You are an expert educator, developer, and visual flowchart designer fluent in Thai.
Your job is to analyze the provided study text (or list of concepts) and output a single valid JSON object containing a deck title, description, summary HTML, Mermaid flowchart, flashcards, and quiz questions.

Do not output any markdown formatting, code fences, or text outside of the JSON object. Return ONLY raw JSON.

JSON Schema:
{
  "title": "🏷️ ชื่อสั้น ๆ เป็นภาษาไทย",
  "description": "คำอธิบายสั้น ๆ เป็นภาษาไทย",
  "summaryHtml": "<Self-contained HTML fragment summary. Use classes: main-title (for h1), section-heading (for h2), key-points (for ul), list-item (for li), important-term (for strong), emphasis-note (for em)>",
  "diagramDsl": "<Raw Mermaid graph LR flowchart DSL only, e.g. graph LR\\nA[Label] --> B[Label]. Use simple ASCII Node IDs only. Enclose Thai labels in quotes A[\"Thai\"]>",
  "cards": [
    {
      "question": "<Flashcard question in Thai>",
      "answer": "<Flashcard answer in Thai>",
      "needs_image": true|false,
      "keyword": "<1-3 English words matching image, or empty string if needs_image is false>",
      "taxonomy": "Remembering"|"Understanding"|"Applying"
    }
  ],
  "quiz": [
    {
      "question": "<Open-ended question in Thai requiring written answer>",
      "answer": "<Ideal correct answer in 2-3 sentences in Thai>",
      "key_points": ["<core point 1>", "<core point 2>", "..."]
    }
  ]
}

Instructions for Assets:
1. Summary HTML:
   - Self-contained HTML fragment (no html/body/div wrapper tags).
   - Clean, nested tags with specified CSS class names.
2. Diagram DSL:
   - Must be valid Mermaid syntax starting with 'graph LR'.
   - Simple ASCII node IDs (A, B, C...).
   - Labels in Thai enclosed in quotes, e.g., A["สภาพภูมิอากาศ"] --> B["การเปลี่ยนสภาพ"].
   - Make sure all quotes and brackets are properly closed.
3. Flashcards:
   - Generate up to 10 cards (maximum 10).
   - Cover Bloom's Taxonomy levels (Remembering, Understanding, Applying).
   - Set needs_image to true only if a visual aid is highly beneficial, and provide English keywords.
4. Quiz:
   - Generate up to 5 open-ended questions (maximum 5).
   - key_points must contain 2-6 core phrases required for a correct answer.
`;
