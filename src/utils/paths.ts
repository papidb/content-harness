import { mkdir } from "node:fs/promises";
import { join } from "node:path";

/** Returns `runs/{date}/{profile}/{niche}` */
export function getRunDir(date: string, profile: string, niche: string): string {
  return join("runs", date, profile, niche);
}

/** Returns `{runDir}/{step:02d}-{name}.{ext}` */
export function getArtifactPath(
  runDir: string,
  step: number,
  name: string,
  ext: string,
): string {
  const paddedStep = String(step).padStart(2, "0");
  return join(runDir, `${paddedStep}-${name}.${ext}`);
}

/** Creates directory and all parents (equivalent to mkdir -p) */
export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/** Returns `profiles/{profile}.md` */
export function getProfilePath(profile: string): string {
  return join("profiles", `${profile}.md`);
}

/** Returns `niches/{niche}.md` */
export function getNichePath(niche: string): string {
  return join("niches", `${niche}.md`);
}

/** Returns `sources/{niche}.json` */
export function getSourcesPath(niche: string): string {
  return join("sources", `${niche}.json`);
}
