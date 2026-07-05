import type { Candidate } from "../schemas/candidate";
import type { RankedCandidate } from "../schemas/ranked-candidate";
import type { AngleResult } from "../schemas/angle";
import { AngleResultSchema } from "../schemas/angle";
import { z } from "zod";
import { logger } from "../utils/logger";
import {
  interpolateTemplate,
  loadPromptTemplate,
  readMarkdown,
} from "../utils/markdown";
import { getNichePath, getProfilePath } from "../utils/paths";
import type { ContentWorker } from "../workers/types";

export async function generateAngles(
  rankedCandidates: RankedCandidate[],
  allCandidates: Candidate[],
  worker: ContentWorker,
  profile: string,
  niche: string,
  topK: number = 3,
): Promise<AngleResult[]> {
  logger.step(4, 7, "Generating angles");

  const [profileContent, nicheContent, promptTemplate] = await Promise.all([
    readMarkdown(getProfilePath(profile)),
    readMarkdown(getNichePath(niche)),
    loadPromptTemplate("generate-angles"),
  ]);

  const topCandidates = rankedCandidates.slice(0, topK);
  const results: AngleResult[] = [];

  for (const ranked of topCandidates) {
    const candidate = allCandidates.find((item) => item.id === ranked.candidateId);
    if (!candidate) {
      continue;
    }

    const prompt = interpolateTemplate(promptTemplate, {
      PROFILE: profileContent,
      NICHE: nicheContent,
      CANDIDATE: JSON.stringify(candidate, null, 2),
    });

    const angleResult = await worker.generateObject({
      system: prompt,
      prompt: "Generate 3-5 specific LinkedIn post angles for this candidate.",
      schema: AngleResultSchema.extend({
        candidateId: z.literal(candidate.id),
      }),
      temperature: 0.7,
      maxTokens: 1024,
    });

    results.push(angleResult);
  }

  logger.success(`Generated angles for ${results.length} candidates`);
  return results;
}
