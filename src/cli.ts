#!/usr/bin/env tsx
import "dotenv/config";

import { program } from "commander";
import type { PipelineConfig } from "./pipeline/daily";
import { runDailyPipeline } from "./pipeline/daily";
import { today } from "./utils/dates";
import { logger } from "./utils/logger";
import { resolveWorker } from "./workers/registry";

interface DailyCommandOptions {
  profile: string;
  niche: string;
  worker: string;
  date: string;
  maxItems: string;
  topK: string;
}

function parseIntegerOption(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer. Received: ${value}`);
  }

  return parsed;
}

async function runDailyCommand(options: DailyCommandOptions): Promise<void> {
  try {
    const maxItems = parseIntegerOption(options.maxItems, "--max-items");
    const topK = parseIntegerOption(options.topK, "--top-k");
    const worker = resolveWorker(options.worker);

    const config: PipelineConfig = {
      profile: options.profile,
      niche: options.niche,
      worker,
      date: options.date,
      maxItems,
      topK,
    };

    await runDailyPipeline(config);
    logger.success("Pipeline complete!");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exit(1);
  }
}

program.name("content-harness").description("Run the content harness daily pipeline").exitOverride();

program
  .command("daily")
  .description("Run the daily content pipeline")
  .requiredOption("--profile <name>", "Profile name")
  .requiredOption("--niche <name>", "Niche name")
  .requiredOption("--worker <type>", "Worker type: openai-compatible | manual")
  .option("--date <date>", "Run date (YYYY-MM-DD)", today())
  .option("--max-items <n>", "Max items per source", "50")
  .option("--top-k <n>", "Top K candidates to advance", "3")
  .action(runDailyCommand);

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const needsDefaultDaily = argv.length === 0 || argv[0]?.startsWith("-");
  const cliArgs = needsDefaultDaily ? ["daily", ...argv] : argv;

  try {
    await program.parseAsync(cliArgs, { from: "user" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exit(1);
  }
}

await main();
