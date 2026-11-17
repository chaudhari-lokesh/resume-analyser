const { z } = require('zod');

/**
 * Score field helper: coerced number clamped between 0 and 100.
 */
const scoreField = z
  .union([z.number(), z.string()])
  .transform((val) => {
    const num = Number(val);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  })
  .default(0);

/**
 * String list helper: ensures array of trimmed, non-empty strings.
 */
const stringListField = z
  .array(z.any())
  .transform((arr) =>
    arr
      .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter((s) => s.length > 0)
  )
  .default([]);

/**
 * Strict schema defining the expected structured AI review output.
 */
const AnalysisResponseSchema = z.object({
  overall_score: scoreField,
  ats_score: scoreField,
  grammar_score: scoreField,
  skills_score: scoreField,
  strengths: stringListField,
  weaknesses: stringListField,
  missing_skills: stringListField,
  recommended_projects: stringListField,
  recommended_certifications: stringListField,
  best_job_roles: stringListField,
  resume_summary: z
    .string()
    .nullish()
    .transform((val) => (val ? String(val).trim() : ''))
    .default(''),
  improved_summary: z
    .string()
    .nullish()
    .transform((val) => (val ? String(val).trim() : ''))
    .default(''),
  interview_questions: stringListField,
  final_suggestions: stringListField,
});

/**
 * Validates and normalizes raw parsed JSON into guaranteed AnalysisResponse structure.
 * @param {unknown} data - Parsed JSON object
 * @returns {z.infer<typeof AnalysisResponseSchema>}
 */
function validateAnalysisData(data) {
  return AnalysisResponseSchema.parse(data);
}

module.exports = {
  AnalysisResponseSchema,
  validateAnalysisData,
};
