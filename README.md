# content-harness

## What it does

content-harness runs a daily content intelligence pipeline for a niche and writing profile. It collects source material, extracts candidate ideas, ranks them deterministically, generates LinkedIn post angles, drafts multiple post options, critiques those drafts, and produces a reviewable digest.

## What it does NOT do

- It doesn't auto-post to LinkedIn.
- It doesn't scrape LinkedIn.
- It doesn't replace human judgment.

## Prerequisites

- Node.js 20 or newer
- pnpm

## Installation

```bash
pnpm install
```

## Configuration

Create a `.env` file in the project root when you want to use the `openai-compatible` worker.

```env
OPENAI_COMPATIBLE_BASE_URL=https://your-provider.example/v1
OPENAI_COMPATIBLE_API_KEY=your-api-key
OPENAI_COMPATIBLE_MODEL=your-model-name
```

- `OPENAI_COMPATIBLE_BASE_URL` points at an OpenAI-compatible API.
- `OPENAI_COMPATIBLE_API_KEY` is the credential for that API.
- `OPENAI_COMPATIBLE_MODEL` is the model the worker should call.
- If you use the `manual` worker, you can skip the `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, and `OPENAI_COMPATIBLE_MODEL` variables.

## Quick start

Run the pipeline with the included example profile and niche:

```bash
pnpm daily --profile friend --niche b2b-creator-economy --worker manual
```

The CLI also supports calling the default `daily` command with bare flags:

```bash
npx tsx src/cli.ts --profile friend --niche b2b-creator-economy --worker manual
```

## CLI flags

The `daily` command is the main entry point. It is also the default command when you pass flags directly.

| Flag | Required | Description | Default |
| --- | --- | --- | --- |
| `--profile <name>` | Yes | Profile file name in `profiles/`, without the `.md` extension. | None |
| `--niche <name>` | Yes | Niche file name in `niches/`, without the `.md` extension. | None |
| `--worker <type>` | Yes | Worker type to use. Supported values are `openai-compatible` and `manual`. | None |
| `--date <date>` | No | Run date in `YYYY-MM-DD` format. | Today |
| `--max-items <n>` | No | Maximum items to collect per source. Must be a positive integer. | `50` |
| `--top-k <n>` | No | Number of top ranked candidates to advance into angle generation. Must be a positive integer. | `3` |

## Adding a profile

Create `profiles/{name}.md` with writing guidance for the pipeline. The included files use a simple markdown structure with sections such as audience, voice, topics, things to avoid, and preferred post structure.

Example shape:

```md
# Profile: Friend

## Audience

B2B marketers and founders.

## Voice

Clear, practical, reflective.
```

## Adding a niche

Create `niches/{name}.md` with guidance about what counts as interesting and what should be ignored. The included niche files use markdown sections for signals worth paying attention to and signals that are boring or low value.

Example shape:

```md
# Niche: Example Niche

## Interesting signals

- New product shifts
- Strong first-party data

## Boring signals

- Generic advice
- Empty motivation
```

## Adding sources

Create `sources/{niche}.json` as an array of source definitions. Every source includes an `id`, `name`, `type`, `tags`, and `reliabilityScore`. The exact extra fields depend on the source type.

Example source entry:

```json
{
  "id": "example",
  "name": "Example Feed",
  "type": "rss",
  "url": "https://example.com/feed",
  "tags": ["tag1"],
  "reliabilityScore": 8
}
```

Supported source types:

- `rss`
- `substack-rss`
- `web-page`
- `sitemap`
- `api`
- `search-query`
- `manual`

Notes by source type:

- `rss` uses a `url`.
- `substack-rss` uses a `url` and can include `publicationName`.
- `web-page` uses a `url` and can include `selectors` plus an optional `strategy` of `html-list` or `article-page`.
- `sitemap` uses a `url`.
- `api` uses a `url` and can include `method` and `headers`.
- `search-query` uses a `query` and can include `engine`.
- `manual` uses an `items` array with `url`, `title`, and optional `summary` fields.

## How to inspect run artifacts

Each pipeline run writes artifacts under:

```text
runs/{date}/{profile}/{niche}/
```

The seven artifacts are:

- `01-raw-items.json`, collected raw content items
- `02-candidates.json`, AI-extracted candidates
- `03-ranked-candidates.json`, deterministically ranked candidates
- `04-angles.json`, LinkedIn post angles
- `05-drafts.json`, three draft types per candidate
- `06-critique.json`, AI critique of each draft
- `07-digest.md`, a human-reviewable digest

Because artifacts are written after each step, failed runs still keep the files produced before the failure.

## Why human approval is required

This system produces options, not decisions. It can gather inputs, suggest angles, and draft posts, but a human still needs to review the evidence, choose what is worth publishing, and reject weak or misleading outputs before anything is used.

## Architecture overview

The architecture has three main parts.

- Collectors load content from the configured source registry. The registry maps source types like `rss`, `substack-rss`, `web-page`, and `manual` to collector implementations.
- The daily pipeline orchestrates seven sequential steps: collect, extract, rank, angle, draft, critique, and digest. It validates profile, niche, and source files first, then writes each artifact into the run directory.
- Workers handle generation. `manual` supports local testing without API keys. `openai-compatible` uses `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, and `OPENAI_COMPATIBLE_MODEL` to call an OpenAI-compatible provider.

## Worker types

Supported worker types:

- `openai-compatible`
- `manual`

## Project scripts

- `pnpm dev`
- `pnpm daily`
- `pnpm typecheck`
# content-harness
