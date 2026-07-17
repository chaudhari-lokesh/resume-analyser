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

/**
 * Parses and sanitizes JSON response from AI provider completion.
 * Extracts JSON content from markdown block wrappers if present.
 * @param {string} text - Raw model output text
 * @returns {object} - Structured analysis object
 */
function cleanJSONResponse(text) {
  let cleaned = text.trim();
  
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = markdownRegex.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }
  
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  try {
    const parsed = JSON.parse(cleaned);
    
    return {
      overall_score: parsed.overall_score || 0,
      ats_score: parsed.ats_score || 0,
      grammar_score: parsed.grammar_score || 0,
      skills_score: parsed.skills_score || 0,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      missing_skills: parsed.missing_skills || [],
      recommended_projects: parsed.recommended_projects || [],
      recommended_certifications: parsed.recommended_certifications || [],
      best_job_roles: parsed.best_job_roles || [],
      resume_summary: parsed.resume_summary || "",
      improved_summary: parsed.improved_summary || "",
      interview_questions: parsed.interview_questions || [],
      final_suggestions: parsed.final_suggestions || []
    };
  } catch (error) {
    console.error('Failed to parse AI response as JSON. Raw text was:', text);
    throw new Error('AI response did not contain valid JSON format: ' + error.message);
  }
}

/**
 * Routes query to the configured AI API provider.
 * @param {string} resumeText - Extracted text content of the resume
 * @returns {Promise<object>} - Structured analysis JSON object
 */
async function queryAI(resumeText) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  
  switch (provider) {
    case 'openai':
      return await queryOpenAI(resumeText);
    case 'gemini':
      return await queryGemini(resumeText);
    case 'claude':
      return await queryClaude(resumeText);
    case 'openrouter':
      return await queryOpenRouter(resumeText);
    case 'grok':
      return await queryGrok(resumeText);
    default:
      throw new Error(`Unsupported AI provider: ${provider}. Please configure AI_PROVIDER in your backend .env file.`);
  }
}

/**
 * Queries OpenAI API.
 */
async function queryOpenAI(resumeText) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in environment variables.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze the following resume text:\n\n${resumeText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.statusText} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return cleanJSONResponse(content);
}

/**
 * Queries Google Gemini API.
 */
async function queryGemini(resumeText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT + `\n\nAnalyze this resume text:\n\n${resumeText}` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Gemini returned an empty response.');
  }

  return cleanJSONResponse(content);
}

/**
 * Queries Anthropic Claude API.
 */
async function queryClaude(resumeText) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY is not configured in environment variables.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: SYSTEM_PROMPT + `\n\nAnalyze this resume text:\n\n${resumeText}` }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Claude returned an empty response.');
  }

  return cleanJSONResponse(content);
}

/**
 * Queries OpenRouter API.
 */
async function queryOpenRouter(resumeText) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Title': 'AI Resume Analyzer'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: SYSTEM_PROMPT + `\n\nAnalyze this resume text:\n\n${resumeText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  return cleanJSONResponse(content);
}

/**
 * Queries xAI Grok API (Responses API).
 */
async function queryGrok(resumeText) {
  const apiKey = process.env.GROK_API_KEY;
  const model = process.env.GROK_MODEL || 'grok-4.5';
  
  if (!apiKey) {
    throw new Error('GROK_API_KEY is not configured in environment variables.');
  }

  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze the following resume text:\n\n${resumeText}` }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.output?.[0]?.content?.[0]?.text;
  
  if (!content) {
    throw new Error('Grok returned an empty response.');
  }

  return cleanJSONResponse(content);
}

module.exports = {
  queryAI
};
