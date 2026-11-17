const { validateAnalysisData } = require('./schema');
const logger = require('./logger');

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) Resume Reviewer and Career Coach.
Analyze the uploaded resume text and provide a structured, detailed review.
You must return ONLY a valid JSON object matching the schema below.
Do not wrap your output in markdown formatting (like \`\`\`json ... \`\`\`), do not output any introductory or concluding text. Your response must be parseable directly via JSON.parse().

Expected JSON Schema:
{
  "overall_score": <number 0-100>,
  "ats_score": <number 0-100>,
  "grammar_score": <number 0-100>,
  "skills_score": <number 0-100>,
  "strengths": [<string list of strengths identified in the resume (aim for 3-5)>],
  "weaknesses": [<string list of weaknesses or areas of improvement (aim for 3-5)>],
  "missing_skills": [<string list of critical skills relevant to their field that are missing or should be added>],
  "recommended_projects": [<string list of 2-3 specific project ideas to build and put on their resume to boost credibility in their target roles>],
  "recommended_certifications": [<string list of industry standard certifications suitable for their field/experience level>],
  "best_job_roles": [<string list of 3-5 job titles/roles they are well suited for or should target>],
  "resume_summary": "<string summary of their current resume summary (or a summary of their profile if none exists)>",
  "improved_summary": "<string rewritten professional summary optimized with keywords and impact metrics that they can copy>",
  "interview_questions": [<string list of 3-5 practice interview questions based on their experience and skills>],
  "final_suggestions": [<string list of actionable steps they can take next to optimize their application success>]
}
`;

const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 45000;
const MAX_NETWORK_RETRIES = 2;

/**
 * Executes fetch with timeout using AbortController and exponential backoff retry for 429 and 5xx errors.
 */
async function fetchWithRetry(url, options, retries = MAX_NETWORK_RETRIES) {
  let attempt = 0;
  let delay = 1000;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on Rate Limit (429) or transient Server Errors (500, 502, 503, 504)
      if ((response.status === 429 || (response.status >= 500 && response.status <= 504)) && attempt < retries) {
        attempt++;
        logger.warn({
          msg: `AI provider returned ${response.status}. Retrying in ${delay}ms... (attempt ${attempt}/${retries})`,
        });
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`AI provider request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
        timeoutErr.status = 504;
        timeoutErr.code = 'AI_TIMEOUT';
        throw timeoutErr;
      }

      if (attempt < retries) {
        attempt++;
        logger.warn({
          msg: `AI provider network error (${err.message}). Retrying in ${delay}ms... (attempt ${attempt}/${retries})`,
        });
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
        continue;
      }

      throw err;
    }
  }
}

/**
 * Extracts, parses, and validates JSON from model raw string output.
 * @param {string} raw - Raw text string from AI model
 * @returns {object} - Validated data object conforming to AnalysisResponseSchema
 */
function extractAndValidateJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('AI provider returned empty response content.');
  }

  let cleaned = raw.trim();

  // Strip code blocks if present
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = markdownRegex.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // Find outermost JSON object
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    throw new Error('AI response is not valid JSON: ' + parseError.message);
  }

  return validateAnalysisData(parsed);
}

/**
 * Provider: Google Gemini
 */
async function queryGemini(resumeText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nAnalyze this resume text:\n\n${resumeText}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Gemini API returned status ${response.status}: ${errText}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return extractAndValidateJSON(rawText);
}

/**
 * Provider: OpenAI
 */
async function queryOpenAI(resumeText) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze the following resume text:\n\n${resumeText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const err = new Error(`OpenAI API returned status ${response.status}: ${JSON.stringify(errData)}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  return extractAndValidateJSON(rawText);
}

/**
 * Provider: Anthropic Claude
 */
async function queryClaude(resumeText) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';

  if (!apiKey) {
    const err = new Error('CLAUDE_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${SYSTEM_PROMPT}\n\nAnalyze this resume text:\n\n${resumeText}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Claude API returned status ${response.status}: ${errText}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text;
  return extractAndValidateJSON(rawText);
}

/**
 * Provider: OpenRouter
 */
async function queryOpenRouter(resumeText) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  if (!apiKey) {
    const err = new Error('OPENROUTER_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Title': 'ResuMind AI',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this resume text:\n\n${resumeText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`OpenRouter API returned status ${response.status}: ${errText}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  return extractAndValidateJSON(rawText);
}

/**
 * Provider: xAI Grok
 */
async function queryGrok(resumeText) {
  const apiKey = process.env.GROK_API_KEY;
  const model = process.env.GROK_MODEL || 'grok-4.5';

  if (!apiKey) {
    const err = new Error('GROK_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const response = await fetchWithRetry('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze the following resume text:\n\n${resumeText}` },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Grok API returned status ${response.status}: ${errText}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  return extractAndValidateJSON(rawText);
}

/**
 * Provider: Local ML Python Backend (Fallback / Local experiment)
 */
async function queryML(resumeText) {
  const { execSync } = require('child_process');
  const path = require('path');
  const rootDir = path.resolve(__dirname, '..').replace(/\\/g, '/');
  const pythonCmd = `python -c "import sys, json; sys.path.append('${rootDir}'); from ml_backend.ml_engine import analyze_resume_ml; text = sys.stdin.read(); print(json.dumps(analyze_resume_ml(text)))"`;
  const resultJson = execSync(pythonCmd, {
    input: resumeText,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return extractAndValidateJSON(resultJson.trim());
}

/**
 * Dispatches query to configured provider, with automatic single retry on malformed JSON.
 * @param {string} resumeText - Extracted text content of resume
 * @returns {Promise<object>} - Validated AnalysisResponseSchema object
 */
async function queryAI(resumeText) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  const runQuery = async () => {
    switch (provider) {
      case 'gemini':
        return await queryGemini(resumeText);
      case 'openai':
        return await queryOpenAI(resumeText);
      case 'claude':
        return await queryClaude(resumeText);
      case 'openrouter':
        return await queryOpenRouter(resumeText);
      case 'grok':
        return await queryGrok(resumeText);
      case 'ml':
        return await queryML(resumeText);
      default:
        throw new Error(
          `Unsupported AI provider: "${provider}". Please configure AI_PROVIDER to gemini, openai, claude, openrouter, or grok.`
        );
    }
  };

  try {
    return await runQuery();
  } catch (firstErr) {
    // If it failed because of malformed JSON, retry once with strict instruction
    if (firstErr.message && firstErr.message.includes('JSON')) {
      logger.warn({ msg: 'AI response was malformed JSON. Retrying once...' });
      try {
        return await runQuery();
      } catch (retryErr) {
        logger.error({ msg: 'Retry after malformed JSON failed', error: retryErr.message });
        const fallbackErr = new Error(
          'The AI model returned an unparseable response after retry. Please try again.'
        );
        fallbackErr.code = 'MALFORMED_AI_RESPONSE';
        fallbackErr.status = 502;
        throw fallbackErr;
      }
    }

    throw firstErr;
  }
}

module.exports = {
  SYSTEM_PROMPT,
  extractAndValidateJSON,
  queryAI,
};
