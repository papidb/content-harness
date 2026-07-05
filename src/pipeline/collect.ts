import type { CollectContext, Source } from "../collectors/types";
import type { CollectorRegistry } from "../collectors/registry";
import type { RawItem } from "../schemas/raw-item";
import { logger } from "../utils/logger";

export async function collectRawItems(
  sources: Source[],
  registry: CollectorRegistry,
  context: CollectContext
): Promise<RawItem[]> {
  const all: RawItem[] = [];

  for (const source of sources) {
    const collector = registry.get(source.type);

    try {
      const items = await collector.collect(source, context);
      logger.info(`Collected ${items.length} items`, `${source.name} (${source.type})`);
      all.push(...items);
    } catch (error) {
      throw new Error(
        `Collection failed for source "${source.name}" (${source.type}): ${(error as Error).message}`
      );
    }
  }

  const seen = new Set<string>();
  const deduped: RawItem[] = [];

  for (const item of all) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduped.push(item);
    }
  }

  logger.success(
    `Total: ${deduped.length} raw items`,
    `(${all.length - deduped.length} duplicates removed)`
  );

  if (deduped.length === 0) {
    throw new Error(
      "No items collected from any source. Check source URLs and network connectivity."
    );
  }

  return deduped;
}
