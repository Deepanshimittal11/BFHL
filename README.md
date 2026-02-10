# BFHL Qualifier 1 — Chitkara University 2026

REST APIs for the qualifier: **POST /bfhl** and **GET /health**.

## Setup

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd bfhl
   npm install
   ```

2. **Environment variables**
   - Copy `.env.example` to `.env`
   - Set `OFFICIAL_EMAIL` to your Chitkara email (e.g. `name.12345@chitkara.edu.in`)
   - Set `GEMINI_API_KEY`: get a free key from [Google AI Studio](https://aistudio.google.com) → Get API Key

3. **Run locally**
   ```bash
   npm start
   ```
   - GET http://localhost:3000/health  
   - POST http://localhost:3000/bfhl (see examples below)

## API Reference

### GET /health

**Response (200)**  
```json
{
  "is_success": true,
  "official_email": "YOUR_CHITKARA_EMAIL"
}
```

### POST /bfhl

Send exactly one key per request: `fibonacci` | `prime` | `lcm` | `hcf` | `AI`.

| Key         | Input              | Output                    |
|------------|--------------------|---------------------------|
| fibonacci  | Integer            | Fibonacci series          |
| prime      | Integer array      | Prime numbers from array  |
| lcm        | Integer array      | LCM value                 |
| hcf        | Integer array      | HCF value                 |
| AI         | Question (string)  | Single-word AI response   |

**Success response (200)**  
```json
{
  "is_success": true,
  "official_email": "YOUR_CHITKARA_EMAIL",
  "data": ...
}
```

**Error response**  
Uses appropriate HTTP status (400, 503, 500) and:
```json
{
  "is_success": false,
  "official_email": "YOUR_CHITKARA_EMAIL",
  "error": "message"
}
```

**Example requests**

```bash
# Fibonacci
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"fibonacci\": 7}"
# → data: [0,1,1,2,3,5,8]

# Prime
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"prime\": [2,4,7,9,11]}"
# → data: [2,7,11]

# LCM
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"lcm\": [12,18,24]}"
# → data: 72

# HCF
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"hcf\": [24,36,60]}"
# → data: 12

# AI (requires GEMINI_API_KEY)
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"AI\": \"What is the capital city of Maharashtra?\"}"
# → data: "Mumbai"
```

## Deployment

### Vercel

1. Push code to a **public** GitHub repo.
2. Login at [vercel.com](https://vercel.com) → **New Project** → Import your repository.
3. Add env vars in Project Settings → Environment Variables:  
   `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
4. Deploy. Use the generated URL (e.g. `https://your-app.vercel.app`).
   - GET `https://your-app.vercel.app/health`  
   - POST `https://your-app.vercel.app/bfhl`

### Railway

1. [New Project](https://railway.app) → **Deploy from GitHub** → select your repo.
2. Add variables: `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
3. Deploy and copy the public URL.

### Render

1. **New** → **Web Service** → connect GitHub and select repo.
2. **Runtime**: Node. **Build**: `npm install`. **Start**: `npm start`.
3. Add env vars: `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
4. Deploy and copy the service URL.

### Local testing with ngrok

```bash
npm start
# In another terminal:
ngrok http 3000
```

Use the ngrok HTTPS URL for testing; keep the local server running.

## Tech

- **Runtime:** Node.js 18+
- **Framework:** Express
- **AI:** Google Gemini (`@google/generative-ai`)

## Checklist

- [x] Strict API response structure (`is_success`, `official_email`, `data` / `error`)
- [x] Correct HTTP status codes (200, 400, 404, 500, 503)
- [x] Input validation and bounds (array length, integer range, single key)
- [x] Graceful error handling (no crashes)
- [x] Security limits (max array size, max question length, safe integers)
- [x] Public APIs (deploy and share base URL + repo)
