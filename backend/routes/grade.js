import express      from 'express';
import { Groq }     from 'groq-sdk';
import { customRateLimiter } from '../middleware/limiter.js';

const router = express.Router();
const groq   = new Groq();

const gradeLimiter = customRateLimiter(60, 60 * 1000); // 60 requests per minute

router.post('/', gradeLimiter, async (req, res) => {
  try {
    const { question, studentAnswer, answer, key_points } = req.body;
    
    // Strict input validations
    if (
      typeof question !== 'string' || question.length > 1000 ||
      typeof answer !== 'string' || answer.length > 1000 ||
      typeof studentAnswer !== 'string' || studentAnswer.length > 1000
    ) {
      return res.status(400).json({ error: 'invalid_input', msg: 'Invalid or oversized input parameters.' });
    }

    if (key_points !== undefined) {
      if (!Array.isArray(key_points) || key_points.length > 10 || key_points.some(p => typeof p !== 'string' || p.length > 200)) {
        return res.status(400).json({ error: 'invalid_input', msg: 'Invalid or oversized key_points.' });
      }
    }

    const safePoints = Array.isArray(key_points) ? key_points : [];

    const SYS_GRADE = {
    role: 'system',
    content: `You are a strict but fair Thai examiner.
Evaluate the student's answer using the provided ideal answer & key_points as a guide.
Return JSON exactly like:
{
  "percent": 85,
  "positive": ["..."],
  "negative": ["..."],
  "suggestion": "..."
}

Scoring rubric:
- Start at 100.
- Subtract 15 for each missing key_point.
- Subtract up to 10 for factual errors / irrelevance.
Clamp percent to [0,100].

Guidelines for fields:
positive   - what the student covered correctly or well.
negative   - key points missing or misconceptions.
suggestion - Actionable tips for next attempt to improve the student's score.
- You don't need to be too harsh and strict on the answers, be fair and give good advice.
- Do not return any commentary. You are to return NOTHING except for the JSON with no code fences.`
  };
    const USER_GRADE = {
      role: 'user',
      content: `QUESTION: ${question}

IDEAL ANSWER: ${answer}

KEY_POINTS: ${safePoints.join('; ')}

STUDENT ANSWER: ${studentAnswer}`
    };
    const r = await groq.chat.completions.create({
   model:       'llama-3.3-70b-versatile',
   messages:    [SYS_GRADE, USER_GRADE],
   max_tokens:  500,
 });

    const json = JSON.parse(r.choices[0].message.content.trim());
    res.json(json);
  } catch (err) {
    console.error('grading failed:', err); 
    res.status(500).json({ error: 'grading_failed', msg: err.message });
  }
});

export default router;
