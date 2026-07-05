import Parser from "rss-parser";
import type { RawItem } from "../schemas/raw-item";
import { isRecent } from "../utils/dates";
import { logger } from "../utils/logger";
import type { CollectContext, Collector, RssSource } from "./types";

const MAX_CONTENT_CHARS = 4000;
const MAX_SUMMARY_CHARS = 2000;
const STALE_DAYS = 7;

function truncate(str: string | undefined, max: number): string | undefined {
  if (!str) {
    return undefined;
  }

  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function generateId(url: string): string {
  let hash = 0;

  for (let index = 0; index < url.length; index += 1) {
    const char = url.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `rss-${Math.abs(hash).toString(36)}`;
}

export class RSSCollector implements Collector<RssSource> {
  readonly type = "rss" as const;

  private readonly parser = new Parser();

  async collect(source: RssSource, context: CollectContext): Promise<RawItem[]> {
    logger.info(`Collecting RSS: ${source.name}`, source.url);

    let feed: Parser.Output<Record<string, unknown>>;
    try {
      feed = await this.parser.parseURL(source.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to fetch RSS feed for source "${source.name}" at ${source.url}: ${message}`
      );
    }

    const seen = new Set<string>();
    const items: RawItem[] = [];
    const fetchedAt = new Date().toISOString();

    for (const item of feed.items ?? []) {
      if (items.length >= context.maxItems) {
        break;
      }

      const url = item.link ?? item.guid ?? "";
      if (!url || seen.has(url)) {
        continue;
      }

      const publishedAt = item.pubDate ?? item.isoDate ?? null;
      if (publishedAt && !isRecent(publishedAt, STALE_DAYS)) {
        continue;
      }

      seen.add(url);
      items.push({
        id: item.guid ? `rss-${item.guid}` : generateId(url),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        url,
        title: item.title ?? "(untitled)",
        publishedAt,
        fetchedAt,
        summary: truncate(
          item.contentSnippet ?? item.summary ?? undefined,
          MAX_SUMMARY_CHARS
        ),
        content: truncate(item.content ?? undefined, MAX_CONTENT_CHARS),
        tags: source.tags,
      });
    }

    logger.success(`Collected ${items.length} items from ${source.name}`);
    return items;
  }
}
