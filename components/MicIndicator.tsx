"use client";

import type { RecognizerState } from "@/lib/recognizer";

type Props = {
  state: RecognizerState;
  confidence: "high" | "low";
};

type Visual = {
  color: string;
  pulse: boolean;
  label: string;
};

function getVisual(state: RecognizerState, confidence: "high" | "low"): Visual {
  if (state === "unsupported") return { color: "stone-400", pulse: false, label: "Browser nicht unterstützt" };
  if (state === "error") return { color: "red-500", pulse: false, label: "Fehler — Mic prüfen" };
  if (state === "starting") return { color: "amber-400", pulse: true, label: "Startet…" };
  if (state === "listening") {
    return confidence === "low"
      ? { color: "amber-500", pulse: true, label: "Hört zu — kein Match (Low Confidence)" }
      : { color: "emerald-500", pulse: true, label: "Hört zu" };
  }
  return { color: "stone-400", pulse: false, label: "Inaktiv" };
}

export default function MicIndicator({ state, confidence }: Props) {
  const visual = getVisual(state, confidence);

  // Tailwind needs full class names — map each color explicitly
  const bgClass: Record<string, string> = {
    "stone-400": "bg-stone-400",
    "red-500": "bg-red-500",
    "amber-400": "bg-amber-400",
    "amber-500": "bg-amber-500",
    "emerald-500": "bg-emerald-500",
  };
  const dot = bgClass[visual.color] ?? "bg-stone-400";

  return (
    <div
      className="group relative inline-flex items-center gap-2"
      title={visual.label}
      aria-label={visual.label}
    >
      <span className={`relative inline-flex h-2.5 w-2.5 ${visual.pulse ? "mic-pulse" : ""}`}>
        <span className={`absolute inset-0 rounded-full ${dot}`} />
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${state === "listening" ? "text-stone-700" : "text-stone-400"}`}
        aria-hidden="true"
      >
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-100 opacity-0 transition-opacity group-hover:opacity-100">
        {visual.label}
      </span>
    </div>
  );
}
