/** Returns today's date as YYYY-MM-DD in local time */
export function today(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns true if the date string is within `maxAgeDays` days of now.
 * Returns true (assume recent) if dateString is null or unparseable.
 */
export function isRecent(
  dateString: string | null,
  maxAgeDays: number,
): boolean {
  if (!dateString) {
    return true;
  }

  const parsed = parseDate(dateString);
  if (!parsed) {
    return true;
  }

  const ageMs = Date.now() - parsed.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= maxAgeDays;
}

/**
 * Safely parses a date string. Returns null if unparseable.
 */
export function parseDate(input: string | null): Date | null {
  if (!input) {
    return null;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}
