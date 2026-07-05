import type { Candidate } from "../schemas/candidate";
import {
  RankedCandidatesSchema,
  type RankedCandidate,
} from "../schemas/ranked-candidate";
import { isRecent } from "../utils/dates";
import { logger } from "../utils/logger";

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n));
}

function scoreFreshness(candidate: Candidate): number {
  if (!candidate.publishedAt) {
    return 5;
  }

  if (isRecent(candidate.publishedAt, 1)) {
    return 10;
  }

  if (isRecent(candidate.publishedAt, 3)) {
    return 8;
  }

  if (isRecent(candidate.publishedAt, 7)) {
    return 6;
  }

  return 2;
}

function scoreRelevance(candidate: Candidate): number {
  const total = candidate.audienceRelevance.length + candidate.whyItMatters.length;
  return clamp(total / 60);
}

function scoreNovelty(candidate: Candidate): number {
  const angleCount = candidate.possibleAngles.length;
  return clamp(angleCount * 2.5);
}

function scoreEvidenceStrength(candidate: Candidate): number {
  return clamp(candidate.evidence.length * 3);
}

function scoreStoryPotential(candidate: Candidate): number {
  const lengthScore = Math.min(candidate.whyItMatters.length / 50, 5);
  const angleScore = Math.min(candidate.possibleAngles.length * 1.5, 5);
  return clamp(lengthScore + angleScore);
}

function scorePracticalUsefulness(candidate: Candidate): number {
  const text = [candidate.summary, ...candidate.possibleAngles].join(" ").toLowerCase();
  const practicalKeywords = [
    "how",
    "step",
    "example",
    "lesson",
    "tactic",
    "tip",
    "guide",
    "framework",
    "practical",
    "use",
    "implement",
  ];
  const matches = practicalKeywords.filter((keyword) => text.includes(keyword)).length;
  return clamp(matches * 1.5);
}

function scoreSaturationPenalty(candidate: Candidate): number {
  if (candidate.summary.length < 50) {
    return 8;
  }

  if (candidate.summary.length < 100) {
    return 4;
  }

  const genericPhrases = [
    "in today",
    "as we know",
    "it's important",
    "the future of",
    "digital transformation",
  ];
  const hasGeneric = genericPhrases.some((phrase) =>
    candidate.summary.toLowerCase().includes(phrase)
  );

  return hasGeneric ? 5 : 1;
}

export async function rankCandidates(
  candidates: Candidate[]
): Promise<RankedCandidate[]> {
  logger.step(3, 7, "Ranking candidates");

  const ranked: RankedCandidate[] = candidates.map((candidate) => {
    const scores = {
      freshness: scoreFreshness(candidate),
      relevance: scoreRelevance(candidate),
      novelty: scoreNovelty(candidate),
      evidenceStrength: scoreEvidenceStrength(candidate),
      storyPotential: scoreStoryPotential(candidate),
      practicalUsefulness: scorePracticalUsefulness(candidate),
      saturationPenalty: scoreSaturationPenalty(candidate),
    };

    const finalScore =
      scores.freshness * 2 +
      scores.relevance * 3 +
      scores.novelty * 2 +
      scores.evidenceStrength * 2 +
      scores.storyPotential * 3 +
      scores.practicalUsefulness * 2 -
      scores.saturationPenalty * 2;

    const reasonParts: string[] = [];
    if (scores.freshness >= 8) {
      reasonParts.push("very fresh");
    }
    if (scores.relevance >= 7) {
      reasonParts.push("highly relevant");
    }
    if (scores.novelty >= 6) {
      reasonParts.push("multiple angles");
    }
    if (scores.evidenceStrength >= 6) {
      reasonParts.push("strong evidence");
    }
    if (scores.saturationPenalty >= 5) {
      reasonParts.push("generic content penalized");
    }

    return {
      candidateId: candidate.id,
      title: candidate.title,
      sourceUrl: candidate.sourceUrl,
      scores,
      finalScore: Math.round(finalScore * 10) / 10,
      rankingReason: reasonParts.length > 0 ? reasonParts.join(", ") : "standard score",
    };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  const validated = RankedCandidatesSchema.parse(ranked);

  logger.success(
    `Ranked ${validated.length} candidates`,
    `top score: ${validated[0]?.finalScore ?? 0}`
  );

  return validated;
}
