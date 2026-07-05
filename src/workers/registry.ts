import { ManualWorker } from "./manual.worker";
import { OpenAICompatibleWorker } from "./openai-compatible.worker";
import type { ContentWorker } from "./types";

type WorkerFactory = () => ContentWorker;

const workerFactories = new Map<string, WorkerFactory>();

export function registerWorker(name: string, factory: WorkerFactory): void {
  workerFactories.set(name, factory);
}

export function resolveWorker(name: string): ContentWorker {
  const factory = workerFactories.get(name);

  if (!factory) {
    const available = [...workerFactories.keys()];
    const availableStr = available.length > 0 ? available.join(", ") : "(none registered yet)";

    throw new Error(`Unknown worker: "${name}". Available: ${availableStr}`);
  }

  return factory();
}

registerWorker("openai-compatible", () => new OpenAICompatibleWorker());

registerWorker("manual", () => new ManualWorker());
