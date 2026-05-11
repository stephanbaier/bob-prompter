import type { Episode } from "./types";

export type EpisodeMeta = {
  slug: string;
  episode: string;
  title: string;
  recordedAt: string;
};

/**
 * Server-side: read all episode JSON files from the data/ directory.
 * Runs at build-time / SSR — not safe for Edge runtime.
 */
export function getAllEpisodes(): EpisodeMeta[] {
  // Only run in Node runtime (server-side). The dynamic require keeps the
  // bundler from trying to ship fs to the client bundle.
  if (typeof window !== "undefined") return [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path") as typeof import("node:path");

  const dataDir = path.join(process.cwd(), "data");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const result: EpisodeMeta[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dataDir, file), "utf-8");
      const parsed = JSON.parse(raw) as Partial<Episode>;
      if (!parsed.episode || !parsed.title) continue;
      const slug = file.replace(/\.json$/i, "").toLowerCase();
      result.push({
        slug,
        episode: parsed.episode,
        title: parsed.title,
        recordedAt: parsed.recordedAt ?? "1970-01-01",
      });
    } catch {
      continue;
    }
  }

  // Sort by recordedAt DESC (latest first)
  result.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return result;
}

export function getLatestEpisodeSlug(): string | null {
  const eps = getAllEpisodes();
  return eps[0]?.slug ?? null;
}

export async function loadEpisode(slug: string): Promise<Episode | null> {
  try {
    const data = await import(`@/data/${slug}.json`);
    return data.default as Episode;
  } catch {
    return null;
  }
}
