"use client";

import type { RecognizerState } from "@/lib/recognizer";

type Props = {
  state: RecognizerState;
  confidence: "high" | "low";
};

type Visual = {
  dotClass: string;
  ringClass: string;
  iconClass: string;
  pulse: boolean;
  label: string;
};

function getVisual(state: RecognizerState, confidence: "high" | "low"): Visual {
  if (state === "unsupported")
    return {
      dotClass: "bg-stone-400",
      ringClass: "ring-stone-200",
      iconClass: "text-stone-400",
      pulse: false,
      label: "Browser nicht unterstützt",
    };
  if (state === "error")
    return {
      dotClass: "bg-red-500",
      ringClass: "ring-red-200",
      iconClass: "text-red-500",
      pulse: false,
      label: "Fehler — Mic prüfen",
    };
  if (state === "starting")
    return {
      dotClass: "bg-amber-400",
      ringClass: "ring-amber-200",
      iconClass: "text-amber-500",
      pulse: true,
      label: "Startet…",
    };
  if (state === "listening") {
    return confidence === "low"
      ? {
          dotClass: "bg-amber-500",
          ringClass: "ring-amber-200",
          iconClass: "text-amber-600",
          pulse: true,
          label: "Hört zu — kein Match (Low Confidence)",
        }
      : {
          dotClass: "bg-emerald-500",
          ringClass: "ring-emerald-200",
          iconClass: "text-emerald-700",
          pulse: true,
          label: "Hört zu",
        };
  }
  return {
    dotClass: "bg-stone-400",
    ringClass: "ring-stone-200",
    iconClass: "text-stone-400",
    pulse: false,
    label: "Inaktiv",
  };
}

export default function MicIndicator({ state, confidence }: Props) {
  const v = getVisual(state, confidence);

  return (
    <div
      className="group relative inline-flex items-center gap-2"
      title={v.label}
      aria-label={v.label}
    >
      <span className={`relative inline-flex h-3.5 w-3.5 ${v.pulse ? "mic-pulse" : ""}`}>
        <span className={`absolute inset-0 rounded-full ${v.dotClass}`} />
      </span>
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white ring-2 ${v.ringClass}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={v.iconClass}
          aria-hidden="true"
        >
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </span>
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-100 opacity-0 transition-opacity group-hover:opacity-100">
        {v.label}
      </span>
    </div>
  );
}
