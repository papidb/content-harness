import { z } from "zod";

export const ScoresSchema = z.object({
  freshness: z.number().min(0).max(10),
  relevance: z.number().min(0).max(10),
  novelty: z.number().min(0).max(10),
  evidenceStrength: z.number().min(0).max(10),
  storyPotential: z.number().min(0).max(10),
  practicalUsefulness: z.number().min(0).max(10),
  saturationPenalty: z.number().min(0).max(10),
});

export const RankedCandidateSchema = z.object({
  candidateId: z.string(),
  title: z.string(),
  sourceUrl: z.string(),
  scores: ScoresSchema,
  finalScore: z.number(),
  rankingReason: z.string(),
});

export type RankedCandidate = z.infer<typeof RankedCandidateSchema>;
export const RankedCandidatesSchema = z.array(RankedCandidateSchema);
export type RankedCandidates = z.infer<typeof RankedCandidatesSchema>;
