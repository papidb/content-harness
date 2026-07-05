import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Reads a markdown file and returns its content as a string */
export async function readMarkdown(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch (err) {
    throw new Error(`Cannot read markdown file: ${path}\n${(err as Error).message}`);
  }
}

/** Writes a string as a markdown file */
export async function writeMarkdown(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf-8");
}

/** Loads a prompt template from `prompts/{name}.md` */
export async function loadPromptTemplate(name: string): Promise<string> {
  const path = join("prompts", `${name}.md`);
  return readMarkdown(path);
}

/**
 * Replaces `{{VAR}}` placeholders in a template string.
 * Missing variables are left as-is (not replaced).
 * Extra variables are ignored.
 */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in vars ? vars[key] : match;
  });
}
