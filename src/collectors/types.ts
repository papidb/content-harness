import { z } from "zod";
import type { RawItem } from "../schemas/raw-item";

const BaseSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.string()),
  reliabilityScore: z.number().min(1).max(10),
});

const RssSourceSchema = BaseSourceSchema.extend({
  type: z.literal("rss"),
  url: z.string(),
});

const SubstackRssSourceSchema = BaseSourceSchema.extend({
  type: z.literal("substack-rss"),
  url: z.string(),
  publicationName: z.string().optional(),
});

const WebPageSelectorsSchema = z.object({
  itemSelector: z.string().optional(),
  titleSelector: z.string().optional(),
  linkSelector: z.string().optional(),
  dateSelector: z.string().optional(),
  summarySelector: z.string().optional(),
});

const WebPageSourceSchema = BaseSourceSchema.extend({
  type: z.literal("web-page"),
  url: z.string(),
  selectors: WebPageSelectorsSchema.optional(),
  strategy: z.enum(["html-list", "article-page"]).optional(),
});

const SitemapSourceSchema = BaseSourceSchema.extend({
  type: z.literal("sitemap"),
  url: z.string(),
});

const ApiSourceSchema = BaseSourceSchema.extend({
  type: z.literal("api"),
  url: z.string(),
  method: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const SearchQuerySourceSchema = BaseSourceSchema.extend({
  type: z.literal("search-query"),
  query: z.string(),
  engine: z.string().optional(),
});

const ManualSourceSchema = BaseSourceSchema.extend({
  type: z.literal("manual"),
  items: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      summary: z.string().optional(),
    })
  ),
});

export const SourceSchema = z.discriminatedUnion("type", [
  RssSourceSchema,
  SubstackRssSourceSchema,
  WebPageSourceSchema,
  SitemapSourceSchema,
  ApiSourceSchema,
  SearchQuerySourceSchema,
  ManualSourceSchema,
]);

export type Source = z.infer<typeof SourceSchema>;
export type RssSource = z.infer<typeof RssSourceSchema>;
export type SubstackRssSource = z.infer<typeof SubstackRssSourceSchema>;
export type WebPageSource = z.infer<typeof WebPageSourceSchema>;
export type SitemapSource = z.infer<typeof SitemapSourceSchema>;
export type ApiSource = z.infer<typeof ApiSourceSchema>;
export type SearchQuerySource = z.infer<typeof SearchQuerySourceSchema>;
export type ManualSource = z.infer<typeof ManualSourceSchema>;

export const SourcesSchema = z.array(SourceSchema);
export type Sources = z.infer<typeof SourcesSchema>;

export interface CollectContext {
  niche: string;
  profile: string;
  date: string;
  maxItems: number;
}

export interface Collector<TSource extends Source = Source> {
  readonly type: TSource["type"];
  collect(source: TSource, context: CollectContext): Promise<RawItem[]>;
}
