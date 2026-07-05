import type { RawItem } from "../schemas/raw-item";
import { logger } from "../utils/logger";
import type { CollectContext, Collector, ManualSource } from "./types";

function generateId(url: string, sourceId: string): string {
  let hash = 0;
  const s = sourceId + url;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return `manual-${Math.abs(hash).toString(36)}`;
}

export class ManualCollector implements Collector<ManualSource> {
  readonly type = "manual" as const;

  async collect(source: ManualSource, context: CollectContext): Promise<RawItem[]> {
    logger.info(`Collecting manual items: ${source.name}`, `${source.items.length} configured`);

    const fetchedAt = new Date().toISOString();
    const items: RawItem[] = source.items.slice(0, context.maxItems).map((item) => ({
      id: generateId(item.url, source.id),
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: item.url,
      url: item.url,
      title: item.title,
      publishedAt: null,
      fetchedAt,
      summary: item.summary,
      content: undefined,
      tags: source.tags,
    }));

    logger.success(`Prepared ${items.length} manual items from ${source.name}`);
    return items;
  }
}
