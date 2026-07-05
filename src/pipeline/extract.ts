import type { Candidate } from "../schemas/candidate";
import { CandidatesSchema } from "../schemas/candidate";
import type { RawItem } from "../schemas/raw-item";
import { logger } from "../utils/logger";
import {
  interpolateTemplate,
  loadPromptTemplate,
  readMarkdown,
} from "../utils/markdown";
import { getNichePath, getProfilePath } from "../utils/paths";
import type { ContentWorker } from "../workers/types";

export async function extractCandidates(
  rawItems: RawItem[],
  worker: ContentWorker,
  profile: string,
  niche: string,
): Promise<Candidate[]> {
  logger.step(2, 7, "Extracting candidates");

  const [profileContent, nicheContent, promptTemplate] = await Promise.all([
    readMarkdown(getProfilePath(profile)),
    readMarkdown(getNichePath(niche)),
    loadPromptTemplate("extract-candidates"),
  ]);

  const prompt = interpolateTemplate(promptTemplate, {
    PROFILE: profileContent,
    NICHE: nicheContent,
    RAW_ITEMS: JSON.stringify(rawItems, null, 2),
  });

  logger.info(`Sending ${rawItems.length} raw items to AI for extraction`);

  const candidates = await worker.generateObject({
    system: prompt,
    prompt: `Extract content candidates from the ${rawItems.length} raw items above. Return a JSON array of candidate objects.`,
    schema: CandidatesSchema,
    temperature: 0.3,
    maxTokens: 4096,
  });

  if (candidates.length === 0) {
    logger.warn("AI returned 0 candidates — no items met the quality threshold");
  }

  logger.success(`Extracted ${candidates.length} candidates from ${rawItems.length} raw items`);

  return candidates;
}
