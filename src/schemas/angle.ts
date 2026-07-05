import { z } from "zod";

export const AngleResultSchema = z.object({
  candidateId: z.string(),
  angles: z.array(z.string()).min(1).max(5),
});

export type AngleResult = z.infer<typeof AngleResultSchema>;
export const AngleResultsSchema = z.array(AngleResultSchema);
export type AngleResults = z.infer<typeof AngleResultsSchema>;
