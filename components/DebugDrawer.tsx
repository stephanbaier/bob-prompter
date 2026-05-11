"use client";

import type { SectionScore } from "@/lib/matcher";
import type { Section } from "@/lib/types";

export type LlmDebugInfo = {
  lastCallAt: number | null;
  lastResult: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  bufferPreview: string;
  topScores: SectionScore[];
  sections: Section[];
  llm: LlmDebugInfo;
};

export default function DebugDrawer({ open, onClose, bufferPreview, topScores, sections, llm }: Props) {
  if (!open) return null;

  const lastWords = bufferPreview.split(/\s+/).slice(-14).join(" ");
  const sectionTitle = (id: string) => sections.find((s) => s.id === id)?.title ?? id;
  const llmRel = llm.lastCallAt ? `vor ${Math.max(1, Math.round((Date.now() - llm.lastCallAt) / 1000))}s` : "—";

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-96 rounded-xl border border-stone-700 bg-stone-900/95 p-4 text-stone-100 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Debug ·{" "}
          <kbd className="rounded bg-stone-700 px-1 py-0.5 text-[10px]">D</kbd> zum Schließen
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-100"
          aria-label="Schließen"
        >
          ×
        </button>
      </div>

      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">Letzte Wörter</div>
        <div className="mt-1 font-mono text-xs leading-relaxed text-stone-200">
          {lastWords || <span className="text-stone-600">…wartet auf Sprache…</span>}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">Top Section-Scores</div>
        <div className="mt-1 space-y-1">
          {topScores.slice(0, 4).map((s, i) => (
            <div key={s.sectionId} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-stone-500">{i + 1}.</span>
              <span className="flex-1 truncate text-stone-200">{sectionTitle(s.sectionId)}</span>
              <span className="font-mono text-stone-400">{s.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-stone-700 pt-3">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">LLM Reality-Check · {llmRel}</div>
        <div className="mt-1 font-mono text-[11px] leading-relaxed text-stone-300">
          {llm.lastResult || <span className="text-stone-600">noch kein Call</span>}
        </div>
      </div>
    </aside>
  );
}
