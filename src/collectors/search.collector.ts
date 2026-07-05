import type { RawItem } from "../schemas/raw-item";
import type { CollectContext, Collector, SearchQuerySource } from "./types";

export class SearchCollector implements Collector<SearchQuerySource> {
  readonly type = "search-query" as const;

  async collect(_source: SearchQuerySource, _context: CollectContext): Promise<RawItem[]> {
    throw new Error(
      "Not implemented: SearchCollector. This collector is planned for a future version."
    );
  }
}
