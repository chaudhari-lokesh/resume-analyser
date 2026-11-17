# ResuMind AI — ATS Resume Analyzer & Career Optimizer

ResuMind AI is a production-grade, privacy-first web application engineered to parse, score, and optimize resumes for modern Applicant Tracking Systems (ATS). It evaluates keyword coverage, verifies format readability, scores grammar and tone, provides tailored role recommendations, and generates interactive mock interview coaching questions.

The system processes resumes entirely in-memory with zero disk persistence, zero database storage, and immediate buffer dereferencing to safeguard personal privacy.

---

## 📸 Interface Preview

```
┌────────────────────────────────────────────────────────────────────────┐
│  ResuMind AI                                                  [Theme]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                  ATS Resume Review & Career Analytics                  │
│     Upload your PDF or DOCX resume for keyword coverage, formatting    │
│            verification, role recommendations, and mock interview      │
│                               coaching.                                │
│                                                                        │
│      ┌──────────────────────────────────────────────────────────┐      │
│      │               [Drag & drop your resume here]             │      │
│      │             Supports PDF or DOCX (Max 5 MB)              │      │
│      └──────────────────────────────────────────────────────────┘      │
│                                                                        │
│  [Overall Score: 85%]  [ATS Match: 90%]  [Grammar: 80%]  [Skills: 88%] │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
*(Drop preview screenshots here when deployed)*

---

## 🛠 Architecture & Tech Stack

```
                     ┌───────────────────────────────┐
                     │     React 19 + Vite (SPA)     │
                     │  Tailwind CSS v4 Design Tokens│
                     │  Accessible ARIA Components   │
                     └──────────────┬────────────────┘
                                    │ HTTP / Multipart Upload (Max 5MB)
                                    ▼
                     ┌───────────────────────────────┐
                     │     Node.js + Express API     │
                     │  - Helmet & Strict CORS       │
                     │  - Express Rate Limiting      │
                     │  - Magic Byte MIME Validation │
                     │  - Pino Structured Logging    │
                     └──────────────┬────────────────┘
                                    │ In-Memory Buffer (No Disk / No DB)
                                    ▼
                     ┌───────────────────────────────┐
                     │ Document Parser (pdfjs / docx)│
                     │  - Detects scanned / empty PDF│
                     │  - Wipes buffer immediately   │
                     └──────────────┬────────────────┘
                                    │ Extracted Text + Zod Schema Prompt
                                    ▼
                     ┌───────────────────────────────┐
                     │       Unified AI Gateway      │
                     │  - AbortController Timeout    │
                     │  - Exponential Backoff Retry  │
                     │  - Zod Schema Validation      │
                     │ (Gemini/OpenAI/Claude/Grok)   │
                     └───────────────────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS v4 with design tokens (`@theme`), Lucide icons, responsive layout (360px to 1440px+).
- **Backend**: Node.js, Express, Helmet, Compression, Express Rate Limit, Multer (memory storage).
- **Document Parsers**: `pdfjs-dist` (PDF parsing), `mammoth` (DOCX parsing), Magic byte signature verification.
- **AI Integration**: Native fetch handlers with `AbortController` timeouts and backoff retry supporting Google Gemini, OpenAI (ChatGPT), Anthropic Claude, OpenRouter, and xAI Grok.
- **Validation**: Strict schema validation and coercing with `Zod`.
- **Logging & Monitoring**: `Pino` structured logging, request correlation IDs (`X-Request-Id`), `/health` and `/ready` probes.

---

## 🎨 Design System & Philosophy

ResuMind AI follows a minimal, tone-based color philosophy:
1. **Neutral Palette**: Zinc/Slate neutral scale with lightness steps defining visual hierarchy.
2. **Single Accent**: Dedicated Indigo token with high contrast and subtle background accents.
3. **Muted Semantics**: Success, warning, and error states are restricted to badges and indicator text—never large fills.
4. **Accessible Score Visuals**: Thin single-color gauges and progress bars in accent tones featuring `progressbar` ARIA attributes.
5. **Dark and Light Mode**: Unified CSS variable design tokens respecting `prefers-color-scheme` and persisted via `localStorage`.
6. **Ink-Friendly Print Stylesheet**: "Download Analysis (PDF)" formats the report into a clean black-and-white vector PDF using standard browser print dialogs.

---

## 🔒 Security & Privacy Notice

- **Memory-Only Processing**: Uploaded resume buffers reside strictly in transient RAM (`multer.memoryStorage()`).
- **Immediate Buffer Cleanup**: Document buffers are explicitly dereferenced and garbage-collected immediately after parsing.
- **Zero Disk & Database Footprint**: No databases, object stores, local files, or session logs store candidate documents.
- **No PII Logging**: Structured loggers automatically redact authorization headers, tokens, and document content.
- **Signature Verification**: Files are verified using binary magic bytes (`%PDF-` and `PK\x03\x04`), preventing file extension spoofing.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js (v20+ or v22+)](https://nodejs.org/)
- npm (v10+)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/resumind-ai.git
cd resumind-ai

# Install root, backend, and frontend packages
npm run install:all
```

### 2. Configure Environment Variables

#### Backend Configuration:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your preferred AI provider:
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000

# Set active provider: gemini | openai | claude | openrouter | grok
AI_PROVIDER=gemini

# Google Gemini Settings (default)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

#### Frontend Configuration:
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Development Servers

Run both backend (port 5000) and frontend (port 5173) concurrently:
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Verification

Run backend unit and integration tests (validating schemas, magic bytes, empty/scanned document rejection, and API probes):
```bash
npm run test
```

Run frontend linter:
```bash
npm run lint
```

Build frontend production bundle:
```bash
npm run build:frontend
```

---

## ☁️ Production Deployment (Render)

The project includes an optimized `render.yaml` specification for zero-config deployments separating the backend Web Service and the frontend Static Site:

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a **Blueprint** deployment pointing to `render.yaml`.
3. In the Render Dashboard, fill in your secret environment variables:
   - `GEMINI_API_KEY` (or your chosen provider's key)
   - `ALLOWED_ORIGINS`: Set to your frontend URL (e.g., `https://resumind-web.onrender.com`)
   - In the frontend service settings, set `VITE_API_URL` to your backend URL (e.g., `https://resumind-api.onrender.com`).
4. Both services deploy with automated health checks at `/health`.

---

## 📄 License

MIT License. Free for commercial and non-commercial use.
