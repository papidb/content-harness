import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

/** Writes data as formatted JSON (2-space indent + trailing newline) */
export async function writeJSON(path: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2) + "\n";
  await writeFile(path, content, "utf-8");
}

/**
 * Reads a JSON file, parses it, and validates it against a Zod schema.
 * Throws descriptively if the file doesn't exist, isn't valid JSON, or fails schema validation.
 */
export async function readJSON<T>(
  path: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err) {
    throw new Error(`Cannot read file: ${path}\n${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in: ${path}\n${(err as Error).message}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Schema validation failed for: ${path}\n${issues}`);
  }

  return result.data;
}
