import { z } from "zod";

export const RawItemSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
  url: z.string(),
  title: z.string(),
  publishedAt: z.string().nullable(),
  fetchedAt: z.string(),
  summary: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()),
});

export type RawItem = z.infer<typeof RawItemSchema>;
export const RawItemsSchema = z.array(RawItemSchema);
export type RawItems = z.infer<typeof RawItemsSchema>;
