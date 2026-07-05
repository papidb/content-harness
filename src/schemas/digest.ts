import { z } from "zod";

// The digest artifact is a Markdown string (07-digest.md).
// This schema is for metadata/summary only, not the full markdown content.
export const DigestMetaSchema = z.object({
  date: z.string(),
  profile: z.string(),
  niche: z.string(),
  topicsReviewed: z.number(),
  draftsGenerated: z.number(),
  recommendedForPosting: z.number(),
});

export type DigestMeta = z.infer<typeof DigestMetaSchema>;
