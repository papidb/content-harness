import type { Collector, Source } from "./types";

export class CollectorRegistry {
  private readonly collectors = new Map<string, Collector>();

  register(collector: Collector): void {
    this.collectors.set(collector.type, collector);
  }

  get(type: Source["type"]): Collector {
    const collector = this.collectors.get(type);
    if (!collector) {
      const available = [...this.collectors.keys()].join(", ");
      throw new Error(
        `No collector registered for type: "${type}". Available: ${available || "(none)"}`
      );
    }
    return collector;
  }

  has(type: string): boolean {
    return this.collectors.has(type);
  }
}
