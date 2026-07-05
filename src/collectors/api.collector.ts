import type { RawItem } from "../schemas/raw-item";
import type { ApiSource, CollectContext, Collector } from "./types";

export class ApiCollector implements Collector<ApiSource> {
  readonly type = "api" as const;

  async collect(_source: ApiSource, _context: CollectContext): Promise<RawItem[]> {
    throw new Error(
      "Not implemented: ApiCollector. This collector is planned for a future version."
    );
  }
}
