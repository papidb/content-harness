import type { DraftResult } from "../schemas/draft";
import type { Critique } from "../schemas/critique";
import { CritiqueSchema } from "../schemas/critique";
import { z } from "zod";
import { logger } from "../utils/logger";
import {
  interpolateTemplate,
  loadPromptTemplate,
  readMarkdown,
} from "../utils/markdown";
import { getProfilePath } from "../utils/paths";
import type { ContentWorker } from "../workers/types";

export async function critiqueDrafts(
  draftResults: DraftResult[],
  worker: ContentWorker,
  profile: string,
): Promise<Critique[]> {
  logger.step(6, 7, "Critiquing drafts");

  const [profileContent, promptTemplate] = await Promise.all([
    readMarkdown(getProfilePath(profile)),
    loadPromptTemplate("critique-drafts"),
  ]);

  const critiques: Critique[] = [];

  for (const draftResult of draftResults) {
    for (const draft of draftResult.drafts) {
      const prompt = interpolateTemplate(promptTemplate, {
        PROFILE: profileContent,
        DRAFT: JSON.stringify(
          {
            type: draft.type,
            content: draft.content,
            notes: draft.notes,
          },
          null,
          2,
        ),
      });

      const critique = await worker.generateObject({
        system: prompt,
        prompt: `Critique this LinkedIn draft. candidateId must be "${draftResult.candidateId}", draftType must be "${draft.type}".`,
        schema: CritiqueSchema.extend({
          candidateId: z.literal(draftResult.candidateId),
          draftType: z.literal(draft.type),
        }),
        temperature: 0.3,
        maxTokens: 1024,
      });

      critiques.push(critique);
    }
  }

  logger.success(`Critiqued ${critiques.length} drafts`);
  return critiques;
}
