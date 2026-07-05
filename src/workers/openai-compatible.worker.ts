import {
  generateText,
  generateObject as aiGenerateObject,
  Output,
  wrapLanguageModel,
  extractReasoningMiddleware,
  extractJsonMiddleware,
  type LanguageModel,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import type { ContentWorker } from "./types";
import { logger } from "../utils/logger";

type ProviderType = "anthropic" | "openai" | "openai-compatible";
const NATIVE_STRUCTURED_OUTPUT_PROVIDERS: ProviderType[] = ["anthropic", "openai"];

function resolveModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "openai-compatible") as ProviderType;
  const model = process.env.AI_MODEL ?? process.env.OPENAI_COMPATIBLE_MODEL;

  if (!model) {
    throw new Error(
      "Missing required environment variable: AI_MODEL (or OPENAI_COMPATIBLE_MODEL)\n" +
        "Set this to your model ID, e.g. claude-sonnet-4-20250514, gpt-4o, etc."
    );
  }

  let baseModel: LanguageModel;

  switch (provider) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_COMPATIBLE_API_KEY;
      if (!apiKey) {
        throw new Error("Missing ANTHROPIC_API_KEY (or OPENAI_COMPATIBLE_API_KEY)");
      }
      const anthropic = createAnthropic({
        apiKey,
        ...(process.env.ANTHROPIC_BASE_URL && { baseURL: process.env.ANTHROPIC_BASE_URL }),
      });
      baseModel = anthropic(model);
      break;
    }

    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_COMPATIBLE_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY (or OPENAI_COMPATIBLE_API_KEY)");
      }
      const openai = createOpenAI({
        apiKey,
        ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
      });
      baseModel = openai(model);
      break;
    }

    case "openai-compatible": {
      const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
      const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY;
      if (!baseURL) {
        throw new Error("Missing OPENAI_COMPATIBLE_BASE_URL");
      }
      if (!apiKey) {
        throw new Error("Missing OPENAI_COMPATIBLE_API_KEY");
      }
      const compatible = createOpenAICompatible({
        name: "custom-provider",
        baseURL: baseURL.replace(/\/$/, ""),
        apiKey,
      });
      baseModel = compatible(model);
      break;
    }

    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${provider}". Supported: anthropic, openai, openai-compatible`
      );
  }

  return wrapLanguageModel({
    model: baseModel,
    middleware: [
      extractReasoningMiddleware({ tagName: "think", startWithReasoning: true }),
      extractJsonMiddleware(),
    ],
  });
}

export class OpenAICompatibleWorker implements ContentWorker {
  readonly id = "openai-compatible";
  private readonly model: LanguageModel;

  constructor() {
    this.model = resolveModel();
    logger.info(
      "[Worker]",
      `Provider: ${process.env.AI_PROVIDER ?? "openai-compatible"}, Model: ${process.env.AI_MODEL ?? process.env.OPENAI_COMPATIBLE_MODEL}`
    );
  }

  private logUsage(result: { usage?: { inputTokens?: number; outputTokens?: number } }) {
    if (result.usage) {
      const total = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
      logger.info("[Worker]", `${total} tokens`);
    }
  }

  async generateText(input: {
    system: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const result = await generateText({
      model: this.model,
      system: input.system,
      prompt: input.prompt,
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxTokens ?? 2048,
    });

    this.logUsage(result);
    return result.text;
  }

  async generateObject<T>(input: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const provider = (process.env.AI_PROVIDER ?? "openai-compatible") as ProviderType;
    if (NATIVE_STRUCTURED_OUTPUT_PROVIDERS.includes(provider)) {
      try {
        return await this.generateObjectNative(input);
      } catch {
        logger.warn("[Worker]", "Native generateObject failed, falling back to text extraction");
      }
    }
    return this.generateObjectViaText(input);
  }

  private async generateObjectNative<T>(input: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const result = await aiGenerateObject({
      model: this.model,
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
      temperature: input.temperature ?? 0.2,
      maxOutputTokens: input.maxTokens ?? 4096,
    });

    this.logUsage(result);
    return result.object as T;
  }

  private async generateObjectViaText<T>(input: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const jsonSchema = z.toJSONSchema(input.schema as z.ZodType);
    const schemaPrompt =
      `${input.system}\n\n` +
      "RESPOND WITH ONLY A SINGLE RAW JSON OBJECT matching this schema:\n" +
      `${JSON.stringify(jsonSchema, null, 2)}\n\n` +
      "Output ONLY the JSON. No thinking, no markdown fences, no explanation.";

    const attempt = async (extraContext?: string): Promise<T> => {
      const userPrompt = extraContext ? `${input.prompt}\n\n${extraContext}` : input.prompt;

      const result = await generateText({
        model: this.model,
        output: Output.object({ schema: input.schema }),
        system: schemaPrompt,
        prompt: userPrompt,
        temperature: input.temperature ?? 0.2,
        maxOutputTokens: input.maxTokens ?? 4096,
      });

      this.logUsage(result);

      if (result.output) return result.output as T;

      throw new Error(`No valid object in response. Raw text: ${result.text.slice(0, 500)}`);
    };

    try {
      return await attempt();
    } catch (firstError) {
      logger.warn("[Worker]", "First attempt failed, retrying with error context");
      try {
        return await attempt(
          `Previous response was invalid: ${(firstError as Error).message}\n` +
            "Fix it. Return ONLY valid JSON matching the schema."
        );
      } catch (secondError) {
        throw new Error(
          "generateObject failed after 2 attempts.\n" +
            `First: ${(firstError as Error).message}\n` +
            `Second: ${(secondError as Error).message}`
        );
      }
    }
  }
}
