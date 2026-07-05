import { z } from "zod";
import type { ContentWorker } from "./types";
import { logger } from "../utils/logger";

function firstValidCandidate<T>(schema: z.ZodSchema<T>, candidates: T[]): T | undefined {
  for (const candidate of candidates) {
    const result = schema.safeParse(candidate);
    if (result.success) {
      return result.data;
    }
  }

  return undefined;
}

/**
 * Generates a minimal valid value for a given Zod schema using shape introspection.
 * This is best-effort — handles common types. For complex schemas, returns a safe fallback.
 */
function generatePlaceholder(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodOptional) {
    return generatePlaceholder(schema.unwrap() as z.ZodTypeAny);
  }

  if (schema instanceof z.ZodNullable) {
    return null;
  }

  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue;
  }

  if (schema instanceof z.ZodString) {
    return (
      firstValidCandidate(schema, [
        "placeholder-string",
        "https://example.com/placeholder",
        "user@example.com",
        "550e8400-e29b-41d4-a716-446655440000",
        "2026-01-01T00:00:00.000Z",
        "placeholder-string-placeholder-string",
      ]) ?? "placeholder-string"
    );
  }

  if (schema instanceof z.ZodNumber) {
    return firstValidCandidate(schema, [5, 1, 0, 10, -1, 100]) ?? 0;
  }

  if (schema instanceof z.ZodBoolean) {
    return true;
  }

  if (schema instanceof z.ZodNull) {
    return null;
  }

  if (schema instanceof z.ZodUndefined) {
    return undefined;
  }

  if (schema instanceof z.ZodEnum) {
    return schema.options[0];
  }

  if (schema instanceof z.ZodLiteral) {
    return schema._def.values[0];
  }

  if (schema instanceof z.ZodArray) {
    const item = generatePlaceholder(schema.element as z.ZodTypeAny);
    const initial = [item, item];
    const initialResult = schema.safeParse(initial);

    if (initialResult.success) {
      return initialResult.data;
    }

    const minIssue = initialResult.error.issues.find(
      (issue): issue is typeof issue & { minimum: number } => {
        if (issue.code !== "too_small" || issue.origin !== "array") {
          return false;
        }

        return "minimum" in issue && typeof issue.minimum === "number";
      }
    );

    if (minIssue) {
      return Array.from({ length: minIssue.minimum }, () => item);
    }

    return initial;
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const result: Record<string, unknown> = {};

    for (const [key, fieldSchema] of Object.entries(shape)) {
      result[key] = generatePlaceholder(fieldSchema);
    }

    return result;
  }

  if (schema instanceof z.ZodUnion) {
    return generatePlaceholder(schema.options[0] as z.ZodTypeAny);
  }

  if (schema instanceof z.ZodDiscriminatedUnion) {
    const options = Array.from(schema.options.values()) as z.ZodTypeAny[];
    return generatePlaceholder(options[0]);
  }

  if (schema instanceof z.ZodRecord) {
    return {};
  }

  return "placeholder";
}

export class ManualWorker implements ContentWorker {
  readonly id = "manual";

  async generateText(input: {
    system: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    logger.info("[ManualWorker] generateText called");
    return `[ManualWorker placeholder response for: ${input.prompt.slice(0, 60)}...]`;
  }

  async generateObject<T>(input: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    logger.info("[ManualWorker] generateObject called");
    const placeholder = generatePlaceholder(input.schema as z.ZodTypeAny);
    const result = input.schema.safeParse(placeholder);

    if (result.success) {
      return result.data;
    }

    throw new Error(
      `ManualWorker could not generate valid placeholder for schema. Zod errors: ${JSON.stringify(result.error.issues)}`
    );
  }
}
