import { z } from "zod";

export const DraftTypeSchema = z.enum(["contrarian", "educational", "personal", "practical"]);
export type DraftType = z.infer<typeof DraftTypeSchema>;

export const DraftSchema = z.object({
  type: DraftTypeSchema,
  content: z.string(),
  notes: z.array(z.string()),
});

export const DraftResultSchema = z.object({
  candidateId: z.string(),
  drafts: z.array(DraftSchema).min(1).max(4),
});

export type Draft = z.infer<typeof DraftSchema>;
export type DraftResult = z.infer<typeof DraftResultSchema>;
export const DraftResultsSchema = z.array(DraftResultSchema);
export type DraftResults = z.infer<typeof DraftResultsSchema>;
