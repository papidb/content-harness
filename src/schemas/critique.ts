import { z } from "zod";

export const CritiqueScoresSchema = z.object({
  hook: z.number().min(0).max(10),
  originality: z.number().min(0).max(10),
  evidence: z.number().min(0).max(10),
  audienceRelevance: z.number().min(0).max(10),
  voiceFit: z.number().min(0).max(10),
  specificity: z.number().min(0).max(10),
  aiSlopRisk: z.number().min(0).max(10),
  postWorthiness: z.number().min(0).max(10),
});

export const CritiqueSchema = z.object({
  candidateId: z.string(),
  draftType: z.string(),
  scores: CritiqueScoresSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedChanges: z.array(z.string()),
  shouldUse: z.boolean(),
});

export type Critique = z.infer<typeof CritiqueSchema>;
export const CritiquesSchema = z.array(CritiqueSchema);
export type Critiques = z.infer<typeof CritiquesSchema>;
