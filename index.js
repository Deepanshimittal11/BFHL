/**
 * Chitkara University 2026 Qualifier - BFHL APIs
 * POST /bfhl | GET /health
 */

require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- GLOBAL MIDDLEWARE ---------- */
app.use(express.json());

/* ---------- CONFIG ---------- */
const OFFICIAL_EMAIL =
  process.env.OFFICIAL_EMAIL || "deepanshi.mittal@chitkara.edu.in";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ---------- LIMITS ---------- */
const MAX_ARRAY_LENGTH = 100;
const MAX_FIBONACCI = 100;
const MAX_AI_QUESTION_LENGTH = 500;
const SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

/* ---------- HELPERS ---------- */
function success(data) {
  return { is_success: true, official_email: OFFICIAL_EMAIL, data };
}

function fail() {
  return { is_success: false, official_email: OFFICIAL_EMAIL };
}

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function fibonacci(n) {
  if (n === 0) return [];
  if (n === 1) return [0];
  const res = [0, 1];
  for (let i = 2; i < n; i++) {
    res.push(res[i - 1] + res[i - 2]);
  }
  return res;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
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
  const provided = keys.filter(k => body[k] !== undefined);
  if (provided.length === 0) return null;
  if (provided.length > 1) return 'multiple';
  return provided[0];
}

/* ---------- AI (GEMINI) ---------- */
async function getSingleWordAIAnswer(question) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Answer with EXACTLY ONE WORD.
No punctuation.
No explanation.

Question: ${question}
`;

  const result = await model.generateContent(prompt);
  const text = result.response?.text?.()?.trim() || "";

  const singleWord = text
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, "");

  return singleWord || "Unknown";
}

/* ---------- POST /bfhl ---------- */
app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ...fail(), error: "Invalid JSON body" });
    }

    const key = getProvidedKey(body);

    if (key === null) {
      return res.status(400).json({
        ...fail(),
        error: "Exactly one of fibonacci, prime, lcm, hcf, AI is required"
      });
    }

    if (key === 'multiple') {
      return res.status(400).json({
        ...fail(),
        error: "Only one key is allowed"
      });
    }

    /* ---- Fibonacci ---- */
    if (key === 'fibonacci') {
      const n = body.fibonacci;
      if (!Number.isInteger(n) || n < 0 || n > MAX_FIBONACCI) {
        return res.status(400).json({
          ...fail(),
          error: "fibonacci must be a non-negative integer ≤ 100"
        });
      }
      return res.status(200).json(success(fibonacci(n)));
    }

    /* ---- Prime ---- */
    if (key === 'prime') {
      const arr = body.prime;
      if (!Array.isArray(arr) || arr.length > MAX_ARRAY_LENGTH) {
        return res.status(400).json({
          ...fail(),
          error: "prime must be an array (max length 100)"
        });
      }
      if (!arr.every(n => Number.isInteger(n) && n >= 0 && n <= SAFE_INTEGER)) {
        return res.status(400).json({
          ...fail(),
          error: "prime array must contain non-negative integers only"
        });
      }
      return res.status(200).json(success(arr.filter(isPrime)));
    }

    /* ---- LCM ---- */
    if (key === 'lcm') {
      const arr = body.lcm;
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > MAX_ARRAY_LENGTH) {
        return res.status(400).json({
          ...fail(),
          error: "lcm must be a non-empty integer array"
        });
      }
      return res.status(200).json(success(lcmOfArray(arr)));
    }

    /* ---- HCF ---- */
    if (key === 'hcf') {
      const arr = body.hcf;
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > MAX_ARRAY_LENGTH) {
        return res.status(400).json({
          ...fail(),
          error: "hcf must be a non-empty integer array"
        });
      }
      return res.status(200).json(success(hcfOfArray(arr)));
    }

    /* ---- AI ---- */
    if (key === 'AI') {
      const question = body.AI;
      if (typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          ...fail(),
          error: "AI must be a non-empty string"
        });
      }
      if (question.length > MAX_AI_QUESTION_LENGTH) {
        return res.status(400).json({
          ...fail(),
          error: "AI question too long"
        });
      }

      try {
        const answer = await getSingleWordAIAnswer(question.trim());
        return res.status(200).json(success(answer));
      } catch (err) {
        return res.status(503).json({
          ...fail(),
          error: "AI service unavailable"
        });
      }
    }

    return res.status(400).json({ ...fail(), error: "Invalid request" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ...fail(),
      error: "Internal server error"
    });
  }
});

/* ---------- GET /health ---------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL
  });
});

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({ ...fail(), error: "Not found" });
});

/* ---------- START ---------- */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BFHL APIs running on port ${PORT}`);
    console.log(`GET  /health`);
    console.log(`POST /bfhl (fibonacci | prime | lcm | hcf | AI)`);
  });
} else {
  module.exports = app;
}