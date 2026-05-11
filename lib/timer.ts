export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export type DurationRange = { minSec: number; maxSec: number };

/** Parse durationHint like "6-12 Min", "~10 Sek", "8-15 Min", "~5 Sek". */
export function parseDurationHint(hint?: string): DurationRange | null {
  if (!hint) return null;
  // "6-12 Min" or "6 - 12 Min"
  const range = hint.match(/(\d+)\s*-\s*(\d+)\s*Min/i);
  if (range) {
    return { minSec: parseInt(range[1]!, 10) * 60, maxSec: parseInt(range[2]!, 10) * 60 };
  }
  // "~10 Sek"
  const sec = hint.match(/(\d+)\s*Sek/i);
  if (sec) {
    const s = parseInt(sec[1]!, 10);
    return { minSec: s, maxSec: s * 2 };
  }
  // "~5 Min" or "5 Min"
  const min = hint.match(/(\d+)\s*Min/i);
  if (min) {
    const m = parseInt(min[1]!, 10);
    return { minSec: m * 60, maxSec: m * 90 };
  }
  return null;
}

/** Color tier for elapsed time vs range */
export function timerStatus(
  elapsed: number,
  range: DurationRange | null,
): "neutral" | "ok" | "warn" | "over" {
  if (!range) return "neutral";
  if (elapsed === 0) return "neutral";
  if (elapsed < range.minSec) return "ok";
  if (elapsed <= range.maxSec) return "warn";
  return "over";
}
