"use client";

import type { Section } from "@/lib/types";

type Props = {
  sections: Section[];
  currentIndex: number;
  onJumpNext: () => void;
};

export default function UpNextPreview({ sections, currentIndex, onJumpNext }: Props) {
  const isLast = currentIndex >= sections.length - 1;
  const next = isLast ? null : sections[currentIndex + 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200 bg-stone-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-2 text-sm">
        {next ? (
          <button
            type="button"
            onClick={onJumpNext}
            className="group flex items-center gap-2 text-stone-500 transition hover:text-accent-dark"
          >
            <span className="text-stone-400 transition group-hover:text-accent">↓</span>
            <span className="text-stone-500">Kommt als Nächstes:</span>
            <span className="font-medium text-stone-700 group-hover:text-accent-dark">
              {next.title}
            </span>
          </button>
        ) : (
          <span className="text-stone-400">Letzte Section dieser Folge.</span>
        )}
        <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
          {currentIndex + 1} / {sections.length}
        </span>
      </div>
    </div>
  );
}
