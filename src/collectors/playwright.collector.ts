// PlaywrightCollector — future implementation for JavaScript-heavy pages.
// No type in the Source union yet — register when the type is added.
import type { RawItem } from "../schemas/raw-item";

export class PlaywrightCollector {
  readonly type = "playwright" as const;

  async collect(_source: unknown, _context: unknown): Promise<RawItem[]> {
    throw new Error(
      "Not implemented: PlaywrightCollector. This collector is planned for a future version."
    );
  }
}
