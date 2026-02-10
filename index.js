/**
 * Chitkara University 2026 Qualifier - BFHL APIs
 * POST /bfhl | GET /health
 */

require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Config (use env in production) ---
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Security & validation limits ---
const MAX_ARRAY_LENGTH = 100;
const MAX_FIBONACCI = 100;
const MAX_AI_QUESTION_LENGTH = 500;
const SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

// --- Helpers ---

function isPrime(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

function fibonacci(n) {
  if (n === 0) return [];
  if (n === 1) return [0];
  const out = [0, 1];
  for (let i = 2; i < n; i++) out.push(out[i - 1] + out[i - 2]);
  return out;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

function lcmOfArray(arr) {
  return arr.reduce((acc, val) => lcm(acc, val), arr[0]);
}

function hcfOfArray(arr) {
  return arr.reduce((acc, val) => gcd(acc, val), arr[0]);
}

function getProvidedKey(body) {
  const keys = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI'];
  const provided = keys.filter((k) => body[k] !== undefined && body[k] !== null);
  if (provided.length === 0) return null;
  if (provided.length > 1) return 'multiple';
  return provided[0];
}

function success(data) {
  return { is_success: true, official_email: OFFICIAL_EMAIL, data };
}

function fail() {
  return { is_success: false, official_email: OFFICIAL_EMAIL };
}

// --- AI (Gemini) ---
async function getSingleWordAIAnswer(question) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Answer the following question with exactly ONE word only. No explanation, no punctuation. Just the single word answer.\n\nQuestion: ${question}`;
  const result = await model.generateContent(prompt);
  const text = result.response?.text?.()?.trim() || '';
  const singleWord = text.split(/\s+/)[0]?.replace(/[.,!?;:]/g, '') || text;
  return singleWord || 'Unknown';
}

// --- POST /bfhl handler ---
app.post('/bfhl', express.json(), async (req, res) => {
  try {
    const body = req.body || {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ ...fail(), error: 'Invalid JSON body' });
      return;
    }

    const key = getProvidedKey(body);
    if (key === null) {
      res.status(400).json({ ...fail(), error: 'Exactly one of fibonacci, prime, lcm, hcf, AI is required' });
      return;
    }
    if (key === 'multiple') {
      res.status(400).json({ ...fail(), error: 'Only one of fibonacci, prime, lcm, hcf, AI is allowed' });
      return;
    }

    if (key === 'fibonacci') {
      const val = body.fibonacci;
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
        res.status(400).json({ ...fail(), error: 'fibonacci must be a non-negative integer' });
        return;
      }
      if (val > MAX_FIBONACCI) {
        res.status(400).json({ ...fail(), error: `fibonacci must be at most ${MAX_FIBONACCI}` });
        return;
      }
      const data = fibonacci(val);
      res.status(200).json(success(data));
      return;
    }

    if (key === 'prime') {
      const val = body.prime;
      if (!Array.isArray(val)) {
        res.status(400).json({ ...fail(), error: 'prime must be an array of integers' });
        return;
      }
      if (val.length > MAX_ARRAY_LENGTH) {
        res.status(400).json({ ...fail(), error: `prime array length must be at most ${MAX_ARRAY_LENGTH}` });
        return;
      }
      const nums = val.filter((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= SAFE_INTEGER);
      if (nums.length !== val.length) {
        res.status(400).json({ ...fail(), error: 'prime must contain only non-negative integers' });
        return;
      }
      const data = nums.filter((n) => isPrime(n));
      res.status(200).json(success(data));
      return;
    }

    if (key === 'lcm') {
      const val = body.lcm;
      if (!Array.isArray(val) || val.length === 0) {
        res.status(400).json({ ...fail(), error: 'lcm must be a non-empty array of integers' });
        return;
      }
      if (val.length > MAX_ARRAY_LENGTH) {
        res.status(400).json({ ...fail(), error: `lcm array length must be at most ${MAX_ARRAY_LENGTH}` });
        return;
      }
      const nums = val.filter((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= SAFE_INTEGER);
      if (nums.length !== val.length) {
        res.status(400).json({ ...fail(), error: 'lcm must contain only non-negative integers' });
        return;
      }
      const data = lcmOfArray(nums);
      res.status(200).json(success(data));
      return;
    }

    if (key === 'hcf') {
      const val = body.hcf;
      if (!Array.isArray(val) || val.length === 0) {
        res.status(400).json({ ...fail(), error: 'hcf must be a non-empty array of integers' });
        return;
      }
      if (val.length > MAX_ARRAY_LENGTH) {
        res.status(400).json({ ...fail(), error: `hcf array length must be at most ${MAX_ARRAY_LENGTH}` });
        return;
      }
      const nums = val.filter((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= SAFE_INTEGER);
      if (nums.length !== val.length) {
        res.status(400).json({ ...fail(), error: 'hcf must contain only non-negative integers' });
        return;
      }
      const data = hcfOfArray(nums);
      res.status(200).json(success(data));
      return;
    }

    if (key === 'AI') {
      const question = body.AI;
      if (typeof question !== 'string') {
        res.status(400).json({ ...fail(), error: 'AI must be a string (question)' });
        return;
      }
      const trimmed = question.trim();
      if (trimmed.length === 0) {
        res.status(400).json({ ...fail(), error: 'AI question cannot be empty' });
        return;
      }
      if (trimmed.length > MAX_AI_QUESTION_LENGTH) {
        res.status(400).json({ ...fail(), error: `AI question length must be at most ${MAX_AI_QUESTION_LENGTH}` });
        return;
      }
      try {
        const data = await getSingleWordAIAnswer(trimmed);
        res.status(200).json(success(data));
      } catch (aiErr) {
        console.error('AI error:', aiErr.message);
        res.status(503).json({ ...fail(), error: 'AI service unavailable' });
      }
      return;
    }

    res.status(400).json({ ...fail(), error: 'Invalid request' });
  } catch (err) {
    console.error('POST /bfhl error:', err);
    res.status(500).json({ ...fail(), error: 'Internal server error' });
  }
});

// --- GET /health ---
app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

// --- 404 and global error ---
app.use((req, res) => {
  res.status(404).json({ ...fail(), error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ...fail(), error: 'Internal server error' });
});

// --- Start server (when run directly); export app for Vercel serverless ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BFHL APIs running on port ${PORT}`);
    console.log(`  GET  /health`);
    console.log(`  POST /bfhl  (fibonacci | prime | lcm | hcf | AI)`);
  });
} else {
  module.exports = app;
}
