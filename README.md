# ResuMind AI - Advanced AI Resume Analyzer & ATS Optimizer

ResuMind AI is a modern, high-performance, and privacy-focused web application designed to grade your resume, evaluate ATS compatibility, identify grammar issues, discover missing keywords, and practice tailored mock interview questions. 

Built using a **React + Tailwind CSS v4** frontend and a **Node.js + Express** backend, it utilizes **PDF.js** and **Mammoth.js** to parse text directly from uploaded files, processing them entirely in memory with **zero permanent storage or database footprints**.

---

## ✨ Features

- **🚀 Live Grading Dashboard**: Beautiful animated circular progress bars measuring Overall Score, ATS Compatibility, Grammar & Style, and Skills Match.
- **🎨 Glassmorphic Premium UI**: A state-of-the-art SaaS interface supporting smooth animations and instant dark/light mode toggles.
- **💡 Detailed Career Analytics**:
  - Key strengths and weaknesses highlighting quantifiable metrics.
  - Recommended industry certifications and role-based projects.
  - Mapped target job titles matching candidate experience.
- **📝 Professional Summary Optimizer**: A side-by-side comparison of the original summary and an AI-optimized summary, complete with a one-click copy button.
- **🎙️ Mock Interview Accordion**: Standard interview questions generated based on your resume, featuring coach tips for structuring answers.
- **🖨️ Clean Vector PDF Downloads**: Clicking "Download PDF" leverages custom print stylesheets to format the analysis dashboard into a vector PDF using the browser's print engine.
- **🔒 Privacy First**: Memory-only processing. Resumes are parsed transiently and sent directly to your configured AI API. Nothing is written to disk.

---

## 🛠️ Technology Stack

- **Frontend**: React (v19), Vite, Tailwind CSS (v4), Lucide Icons
- **Backend**: Node.js, Express, Multer (in-memory file handling)
- **Document Parsers**: PDF.js (`pdfjs-dist`), Mammoth.js (DOCX parsing)
- **AI Integrations**: Native fetch handlers supporting Google Gemini, OpenAI (ChatGPT), Anthropic Claude, and OpenRouter APIs.

---

## 🚀 Setup & Installation

### Prerequisite
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed.

### Step 1: Install All Dependencies
Open your terminal in the project root directory (`d:\Rsume-analyser`) and run the installer script:
```bash
npm run install:all
```
*This installs root dependencies (`concurrently`), backend packages, and frontend modules.*

### Step 2: Configure Environment Variables
1. Navigate to the `backend/` directory.
2. Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Set your active AI provider and add the corresponding API key. 
   *(For example, if you have a Google Gemini key, set `AI_PROVIDER=gemini` and enter your key in `GEMINI_API_KEY`)*:
   ```env
   # Server Configuration
   PORT=5000

   # Active AI Provider: gemini | openai | claude | openrouter
   AI_PROVIDER=gemini

   # Google Gemini Settings
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   ```

---

## 💻 Running the Application

To start both the Express API backend (Port 5000) and the React web app (Port 5173) concurrently, run the following command in the **root directory**:

```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🔒 Security & Privacy Notice
All file processing is performed transiently in the server's memory (`multer.memoryStorage()`). File buffers are parsed to text, sent to the configured AI API in a single completion request, and the results are immediately returned to your browser. **No databases, file writing, history logs, or tracking are used.**
