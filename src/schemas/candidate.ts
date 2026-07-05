import { z } from "zod";

export const CandidateSchema = z.object({
  id: z.string(),
  rawItemId: z.string(),
  title: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string().nullable(),
  summary: z.string(),
  whyItMatters: z.string(),
  audienceRelevance: z.string(),
  possibleAngles: z.array(z.string()),
  evidence: z.array(z.string()),
  riskNotes: z.array(z.string()),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export const CandidatesSchema = z.array(CandidateSchema);
export type Candidates = z.infer<typeof CandidatesSchema>;
