"use client";

import type { Section } from "@/lib/types";

const SHORT_LABELS: Record<string, string> = {
  // F005 SPEAKING format (10 sections)
  "cold-open": "Cold",
  greeting: "Greet",
  "small-talk": "Small",
  "themen-pivot": "Pivot",
  "topic-1": "T1",
  "topic-2": "T2",
  "topic-3": "T3",
  "wins-fails": "W/F",
  outro: "Outro",
  close: "Close",
  // Legacy F003/F004 format (12 sections)
  banter: "Small",
  "pivot-line": "Pivot",
  "thema-1": "T1",
  "thema-2": "T2",
  "thema-3": "T3",
  "sieger-verlierer": "W/L",
  "outro-beginn": "Outro",
  "show-closer": "Closer",
  "brand-anker": "Brand",
  "final-sign-off": "Sign",
};

function shortLabel(sectionId: string): string {
  return SHORT_LABELS[sectionId] ?? sectionId.slice(0, 6);
}

type Props = {
  sections: Section[];
  currentIndex: number;
  onSelect: (idx: number) => void;
};

export default function Timeline({ sections, currentIndex, onSelect }: Props) {
  return (
    <div className="sticky top-[57px] z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-4 py-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {sections.map((section, i) => {
            const isActive = i === currentIndex;
            const isPast = i < currentIndex;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(i)}
                title={section.title}
                className={[
                  "group flex min-w-[58px] flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-200",
                  isActive
                    ? "scale-105 bg-accent text-white shadow-sm"
                    : isPast
                      ? "bg-stone-200/70 text-stone-500 hover:bg-stone-300"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-mono text-[11px] leading-none",
                    isActive ? "text-white/80" : "text-stone-500",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium leading-none">
                  {shortLabel(section.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
