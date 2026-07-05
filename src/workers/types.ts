import type { z } from "zod";

export interface ContentWorker {
  readonly id: string;

  generateText(input: {
    system: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;

  generateObject<T>(input: {
    system: string;
    prompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T>;
}
