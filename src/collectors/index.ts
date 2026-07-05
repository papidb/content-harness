import { CollectorRegistry } from "./registry";
import { ApiCollector } from "./api.collector";
import { ManualCollector } from "./manual.collector";
import { RSSCollector } from "./rss.collector";
import { SearchCollector } from "./search.collector";
import { SitemapCollector } from "./sitemap.collector";
import { SubstackCollector } from "./substack.collector";
import { WebPageCollector } from "./web-page.collector";

export { ApiCollector } from "./api.collector";
export { CollectorRegistry } from "./registry";
export { ManualCollector } from "./manual.collector";
export { PlaywrightCollector } from "./playwright.collector";
export { RSSCollector } from "./rss.collector";
export { SearchCollector } from "./search.collector";
export { SitemapCollector } from "./sitemap.collector";
export { SubstackCollector } from "./substack.collector";
export { WebPageCollector } from "./web-page.collector";
export type {
  Collector,
  CollectContext,
  Source,
  RssSource,
  SubstackRssSource,
  WebPageSource,
  SitemapSource,
  ApiSource,
  SearchQuerySource,
  ManualSource,
  Sources,
} from "./types";
export { SourceSchema, SourcesSchema } from "./types";

export function createDefaultRegistry(): CollectorRegistry {
  const registry = new CollectorRegistry();
  registry.register(new ApiCollector());
  registry.register(new ManualCollector());
  registry.register(new RSSCollector());
  registry.register(new SearchCollector());
  registry.register(new SitemapCollector());
  registry.register(new SubstackCollector());
  registry.register(new WebPageCollector());
  return registry;
}
