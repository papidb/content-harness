import type { AngleResult } from "../schemas/angle";
import type { Candidate } from "../schemas/candidate";
import type { DraftResult } from "../schemas/draft";
import { DraftResultSchema } from "../schemas/draft";
import { z } from "zod";
import { logger } from "../utils/logger";
import {
  interpolateTemplate,
  loadPromptTemplate,
  readMarkdown,
} from "../utils/markdown";
import { getNichePath, getProfilePath } from "../utils/paths";
import type { ContentWorker } from "../workers/types";

export async function generateDrafts(
  angles: AngleResult[],
  candidates: Candidate[],
  worker: ContentWorker,
  profile: string,
  niche: string,
): Promise<DraftResult[]> {
  logger.step(5, 7, "Generating drafts");

  const [profileContent, nicheContent, promptTemplate] = await Promise.all([
    readMarkdown(getProfilePath(profile)),
    readMarkdown(getNichePath(niche)),
    loadPromptTemplate("write-drafts"),
  ]);

  const results: DraftResult[] = [];

  for (const angleResult of angles) {
    const candidate = candidates.find((item) => item.id === angleResult.candidateId);
    if (!candidate) {
      continue;
    }

    const prompt = interpolateTemplate(promptTemplate, {
      PROFILE: profileContent,
      NICHE: nicheContent,
      CANDIDATE: JSON.stringify(candidate, null, 2),
      ANGLES: JSON.stringify(angleResult.angles, null, 2),
    });

    const draftResult = await worker.generateObject({
      system: prompt,
      prompt: "Write 3 LinkedIn post drafts (contrarian, educational, practical) for this candidate.",
      schema: DraftResultSchema.extend({
        candidateId: z.literal(candidate.id),
      }),
      temperature: 0.8,
      maxTokens: 2048,
    });

    results.push(draftResult);
  }

  logger.success(`Generated drafts for ${results.length} candidates`);
  return results;
}
