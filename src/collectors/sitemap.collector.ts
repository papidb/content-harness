import type { RawItem } from "../schemas/raw-item";
import type { CollectContext, Collector, SitemapSource } from "./types";

export class SitemapCollector implements Collector<SitemapSource> {
  readonly type = "sitemap" as const;

  async collect(_source: SitemapSource, _context: CollectContext): Promise<RawItem[]> {
    throw new Error(
      "Not implemented: SitemapCollector. This collector is planned for a future version."
    );
  }
}
