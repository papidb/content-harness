import * as cheerio from "cheerio";
import type { RawItem } from "../schemas/raw-item";
import { logger } from "../utils/logger";
import type { CollectContext, Collector, WebPageSource } from "./types";

const MAX_CONTENT_CHARS = 4000;
const MIN_CONTENT_TITLE_LENGTH = 10;
const NAVIGATION_KEYWORDS =
  /^(home|about|contact|login|log in|sign in|sign up|menu|search|privacy|terms|cookies|newsletter)$/i;
const NAVIGATION_PATH_SEGMENTS = new Set([
  "about",
  "account",
  "advertise",
  "careers",
  "cart",
  "contact",
  "faq",
  "help",
  "jobs",
  "legal",
  "login",
  "logout",
  "menu",
  "newsletters",
  "privacy",
  "register",
  "search",
  "settings",
  "shop",
  "signin",
  "signup",
  "subscribe",
  "support",
  "terms",
]);

function normalizeWhitespace(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeUrl(href: string, base: string): string | null {
  if (!href) {
    return null;
  }

  const trimmedHref = href.trim();
  if (
    trimmedHref.startsWith("#") ||
    trimmedHref.startsWith("javascript:") ||
    trimmedHref.startsWith("mailto:") ||
    trimmedHref.startsWith("tel:")
  ) {
    return null;
  }

  try {
    return new URL(trimmedHref, base).toString();
  } catch {
    return null;
  }
}

function isNavigationLink(text: string, url: string): boolean {
  const trimmedText = normalizeWhitespace(text);
  if (trimmedText.length < MIN_CONTENT_TITLE_LENGTH) {
    return true;
  }

  if (NAVIGATION_KEYWORDS.test(trimmedText)) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname
      .split("/")
      .map((segment) => segment.trim().toLowerCase())
      .filter(Boolean);

    return segments.some((segment) => NAVIGATION_PATH_SEGMENTS.has(segment));
  } catch {
    return false;
  }
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function generateId(url: string, sourceId: string): string {
  let hash = 0;
  const value = `${sourceId}${url}`;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `web-${Math.abs(hash).toString(36)}`;
}

export class WebPageCollector implements Collector<WebPageSource> {
  readonly type = "web-page" as const;

  async collect(source: WebPageSource, context: CollectContext): Promise<RawItem[]> {
    logger.info(`Collecting web page: ${source.name}`, source.url);

    let html: string;
    try {
      const response = await fetch(source.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; content-harness/1.0)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      html = await response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch web page "${source.name}" at ${source.url}: ${message}`);
    }

    const $ = cheerio.load(html);
    const selectors = source.selectors;
    const seen = new Set<string>();
    const items: RawItem[] = [];
    const fetchedAt = new Date().toISOString();

    if (selectors?.itemSelector) {
      $(selectors.itemSelector).each((_, element) => {
        if (items.length >= context.maxItems) {
          return false;
        }

        const item = $(element);
        const title = selectors.titleSelector
          ? normalizeWhitespace(item.find(selectors.titleSelector).first().text())
          : normalizeWhitespace(item.text());
        const href = selectors.linkSelector
          ? item.find(selectors.linkSelector).first().attr("href") ?? ""
          : item.find("a").first().attr("href") ?? "";
        const url = normalizeUrl(href, source.url);

        if (!url || seen.has(url)) {
          return;
        }

        const summary = selectors.summarySelector
          ? truncate(
              normalizeWhitespace(item.find(selectors.summarySelector).first().text()) || undefined,
              MAX_CONTENT_CHARS
            )
          : undefined;
        const publishedAt = selectors.dateSelector
          ? normalizeWhitespace(item.find(selectors.dateSelector).first().text()) || null
          : null;

        seen.add(url);
        items.push({
          id: generateId(url, source.id),
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          url,
          title: title || url,
          publishedAt,
          fetchedAt,
          summary,
          tags: source.tags,
        });
      });
    } else {
      const containers = ["article", "main", "[role='main']", "body"];
      const containerSelector = containers.find((selector) => $(selector).length > 0) ?? "body";
      const container = $(containerSelector).first();

      container.find("a[href]").each((_, element) => {
        if (items.length >= context.maxItems) {
          return false;
        }

        const link = $(element);
        const href = link.attr("href") ?? "";
        const url = normalizeUrl(href, source.url);

        if (!url || seen.has(url)) {
          return;
        }

        const title = normalizeWhitespace(link.text());
        if (isNavigationLink(title, url)) {
          return;
        }

        seen.add(url);
        items.push({
          id: generateId(url, source.id),
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          url,
          title: title || url,
          publishedAt: null,
          fetchedAt,
          tags: source.tags,
        });
      });
    }

    logger.success(`Collected ${items.length} items from ${source.name}`);
    return items;
  }
}
