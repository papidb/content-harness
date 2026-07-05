// This is the ONLY file in the project allowed to use console.log/warn/error.

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const GREY = "\x1b[90m";

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export const logger = {
  info(message: string, detail?: string): void {
    const suffix = detail ? ` ${GREY}${detail}${RESET}` : "";
    console.log(`${GREY}${timestamp()}${RESET} ${CYAN}ℹ${RESET} ${message}${suffix}`);
  },

  success(message: string, detail?: string): void {
    const suffix = detail ? ` ${GREY}${detail}${RESET}` : "";
    console.log(`${GREY}${timestamp()}${RESET} ${GREEN}${BOLD}✓${RESET} ${message}${suffix}`);
  },

  warn(message: string, detail?: string): void {
    const suffix = detail ? ` ${GREY}${detail}${RESET}` : "";
    console.warn(`${GREY}${timestamp()}${RESET} ${YELLOW}⚠${RESET} ${message}${suffix}`);
  },

  error(message: string, detail?: string): void {
    const suffix = detail ? `\n  ${detail}` : "";
    console.error(`${GREY}${timestamp()}${RESET} ${RED}${BOLD}✗${RESET} ${message}${suffix}`);
  },

  step(stepNum: number, total: number, name: string): void {
    console.log(`\n${BOLD}[Step ${stepNum}/${total}]${RESET} ${name}...`);
  },
};
