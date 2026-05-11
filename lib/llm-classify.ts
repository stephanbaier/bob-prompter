"use client";

import type { Section } from "./types";

export type LlmClassifyResult =
  | { sectionId: string; confidence: number; reasoning: string }
  | { skipped: true; reason: string }
  | { error: string };

export async function classifyTranscript(input: {
  transcript: string;
  sections: Section[];
  currentSectionId: string;
}): Promise<LlmClassifyResult> {
  const minimalSections = input.sections.map((s) => ({
    id: s.id,
    title: s.title,
    contextHint: s.contextHint,
  }));

  try {
    const res = await fetch("/api/llm-classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: input.transcript,
        sections: minimalSections,
        currentSectionId: input.currentSectionId,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: body.error ?? `HTTP ${res.status}` };
    }
    const data = (await res.json()) as LlmClassifyResult;
    return data;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
