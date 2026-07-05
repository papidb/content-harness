import { existsSync } from "node:fs";
import type { ContentWorker } from "../workers/types";
import { collectRawItems } from "./collect";
import { extractCandidates } from "./extract";
import { rankCandidates } from "./rank";
import { generateAngles } from "./angle";
import { generateDrafts } from "./draft";
import { critiqueDrafts } from "./critique";
import { generateDigest } from "./digest";
import { createDefaultRegistry } from "../collectors/index";
import { SourcesSchema } from "../collectors/types";
import { RawItemsSchema } from "../schemas/raw-item";
import { CandidatesSchema } from "../schemas/candidate";
import { RankedCandidatesSchema } from "../schemas/ranked-candidate";
import { AngleResultsSchema } from "../schemas/angle";
import { DraftResultsSchema } from "../schemas/draft";
import { CritiquesSchema } from "../schemas/critique";
import {
  getRunDir,
  getArtifactPath,
  ensureDir,
  getProfilePath,
  getNichePath,
  getSourcesPath,
} from "../utils/paths";
import { writeJSON, readJSON } from "../utils/json";
import { writeMarkdown } from "../utils/markdown";
import { logger } from "../utils/logger";

export interface PipelineConfig {
  profile: string;
  niche: string;
  worker: ContentWorker;
  date: string;
  maxItems: number;
  topK: number;
}

export async function runDailyPipeline(config: PipelineConfig): Promise<void> {
  const { profile, niche, worker, date, maxItems, topK } = config;

  if (!existsSync(getProfilePath(profile))) {
    throw new Error(
      `Profile not found: ${getProfilePath(profile)}\nCreate profiles/${profile}.md to define the writing profile.`
    );
  }

  if (!existsSync(getNichePath(niche))) {
    throw new Error(
      `Niche not found: ${getNichePath(niche)}\nCreate niches/${niche}.md to define the niche.`
    );
  }

  if (!existsSync(getSourcesPath(niche))) {
    throw new Error(
      `Sources not found: ${getSourcesPath(niche)}\nCreate sources/${niche}.json to define content sources.`
    );
  }

  const runDir = getRunDir(date, profile, niche);
  await ensureDir(runDir);
  logger.info(`Run directory: ${runDir}`);

  const sources = await readJSON(getSourcesPath(niche), SourcesSchema);
  logger.info(`Loaded ${sources.length} sources for niche "${niche}"`);

  const registry = createDefaultRegistry();
  const context = { niche, profile, date, maxItems };

  logger.step(1, 7, "Collecting raw items");
  const rawItems = RawItemsSchema.parse(await collectRawItems(sources, registry, context));
  await writeJSON(getArtifactPath(runDir, 1, "raw-items", "json"), rawItems);
  logger.success(`Step 1 done: ${rawItems.length} raw items saved`);

  const candidates = CandidatesSchema.parse(
    await extractCandidates(rawItems, worker, profile, niche)
  );
  await writeJSON(getArtifactPath(runDir, 2, "candidates", "json"), candidates);
  logger.success(`Step 2 done: ${candidates.length} candidates saved`);

  const ranked = RankedCandidatesSchema.parse(await rankCandidates(candidates));
  await writeJSON(getArtifactPath(runDir, 3, "ranked-candidates", "json"), ranked);
  logger.success(`Step 3 done: ${ranked.length} ranked candidates saved`);

  const angles = AngleResultsSchema.parse(
    await generateAngles(ranked, candidates, worker, profile, niche, topK)
  );
  await writeJSON(getArtifactPath(runDir, 4, "angles", "json"), angles);
  logger.success(`Step 4 done: ${angles.length} angle results saved`);

  const drafts = DraftResultsSchema.parse(
    await generateDrafts(angles, candidates, worker, profile, niche)
  );
  await writeJSON(getArtifactPath(runDir, 5, "drafts", "json"), drafts);
  logger.success(`Step 5 done: ${drafts.length} draft results saved`);

  const critiques = CritiquesSchema.parse(await critiqueDrafts(drafts, worker, profile));
  await writeJSON(getArtifactPath(runDir, 6, "critique", "json"), critiques);
  logger.success(`Step 6 done: ${critiques.length} critiques saved`);

  const digest = await generateDigest(ranked, candidates, drafts, critiques, profile, niche, date);
  await writeMarkdown(getArtifactPath(runDir, 7, "digest", "md"), digest);
  logger.success("Step 7 done: digest saved");

  logger.success(
    "\nPipeline complete!",
    `Digest: ${getArtifactPath(runDir, 7, "digest", "md")}`
  );
}
