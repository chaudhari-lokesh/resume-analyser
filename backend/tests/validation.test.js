const { describe, it } = require('node:test');
const assert = require('node:assert');
const { validateAnalysisData, AnalysisResponseSchema } = require('../schema');
const { extractAndValidateJSON } = require('../ai');

describe('Schema & Validation Tests', () => {
  it('validates a complete, correctly typed analysis response', () => {
    const validData = {
      overall_score: 85,
      ats_score: 90,
      grammar_score: 80,
      skills_score: 88,
      strengths: ['Strong technical stack', 'Quantifiable outcomes'],
      weaknesses: ['Missing cloud certifications'],
      missing_skills: ['AWS', 'Docker'],
      recommended_projects: ['Build a cloud-native microservice'],
      recommended_certifications: ['AWS Certified Solutions Architect'],
      best_job_roles: ['Senior Full Stack Engineer'],
      resume_summary: 'Full stack engineer with 5 years experience.',
      improved_summary: 'Results-driven Full Stack Engineer with 5+ years...',
      interview_questions: ['Describe how you design for high availability.'],
      final_suggestions: ['Add metrics to bullet points.'],
    };

    const result = validateAnalysisData(validData);
    assert.strictEqual(result.overall_score, 85);
    assert.strictEqual(result.ats_score, 90);
    assert.strictEqual(result.strengths.length, 2);
    assert.strictEqual(result.missing_skills[0], 'AWS');
  });

  it('clamps and coerces score values between 0 and 100', () => {
    const dataWithEdgeScores = {
      overall_score: 150,
      ats_score: -20,
      grammar_score: '88',
      skills_score: 'invalid',
    };

    const result = validateAnalysisData(dataWithEdgeScores);
    assert.strictEqual(result.overall_score, 100);
    assert.strictEqual(result.ats_score, 0);
    assert.strictEqual(result.grammar_score, 88);
    assert.strictEqual(result.skills_score, 0);
  });

  it('correctly filters non-string or empty elements in lists', () => {
    const dataWithDirtyLists = {
      strengths: ['Good communicator', '', null, '   ', 'Strong leadership'],
      weaknesses: [123, 'Needs more metrics'],
    };

    const result = validateAnalysisData(dataWithDirtyLists);
    assert.deepStrictEqual(result.strengths, ['Good communicator', 'Strong leadership']);
    assert.deepStrictEqual(result.weaknesses, ['123', 'Needs more metrics']);
  });

  it('extracts and parses JSON wrapped in markdown code blocks', () => {
    const markdownOutput = `
Here is your analysis:
\`\`\`json
{
  "overall_score": 78,
  "ats_score": 82,
  "grammar_score": 75,
  "skills_score": 79,
  "strengths": ["Clear layout"],
  "weaknesses": ["Action verbs missing"],
  "missing_skills": ["Kubernetes"],
  "recommended_projects": ["Distributed system demo"],
  "recommended_certifications": ["CKA"],
  "best_job_roles": ["DevOps Engineer"],
  "resume_summary": "DevOps enthusiast",
  "improved_summary": "Certified Kubernetes Administrator with expertise...",
  "interview_questions": ["What is a pod?"],
  "final_suggestions": ["Reformat skills section"]
}
\`\`\`
Hope this helps!
    `;

    const parsed = extractAndValidateJSON(markdownOutput);
    assert.strictEqual(parsed.overall_score, 78);
    assert.strictEqual(parsed.ats_score, 82);
    assert.strictEqual(parsed.missing_skills[0], 'Kubernetes');
  });

  it('throws a descriptive error when JSON is invalid', () => {
    const invalidText = 'Sorry, as an AI model I cannot analyze this file.';
    assert.throws(
      () => extractAndValidateJSON(invalidText),
      /AI response is not valid JSON/
    );
  });
});
