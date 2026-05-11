"use client";

import type { RecognizerState } from "@/lib/recognizer";
import MicIndicator from "./MicIndicator";
import { formatTime, timerStatus, type DurationRange } from "@/lib/timer";

type Props = {
  episodeTitle: string;
  recognizerState: RecognizerState;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStart: () => void;
  onStop: () => void;
  currentIndex: number;
  totalSections: number;
  confidence: "high" | "low";
  timerSecs: number;
  timerRunning: boolean;
  timerRange: DurationRange | null;
  onToggleTimer: () => void;
  onResetTimer: () => void;
};

export default function ControlBar({
  episodeTitle,
  recognizerState,
  autoFollow,
  onToggleAutoFollow,
  onPrev,
  onNext,
  onStart,
  onStop,
  currentIndex,
  totalSections,
  confidence,
  timerSecs,
  timerRunning,
  timerRange,
  onToggleTimer,
  onResetTimer,
}: Props) {
  const isListening = recognizerState === "listening" || recognizerState === "starting";

  const status = timerStatus(timerSecs, timerRange);
  const statusBg: Record<typeof status, string> = {
    neutral: "bg-stone-100 text-stone-700",
    ok: "bg-emerald-100 text-emerald-900",
    warn: "bg-amber-100 text-amber-900",
    over: "bg-red-100 text-red-900",
  };

  const headerBg =
    recognizerState === "listening" && confidence === "high"
      ? "bg-emerald-50/70"
      : recognizerState === "listening" && confidence === "low"
        ? "bg-amber-50/70"
        : recognizerState === "error"
          ? "bg-red-50/70"
          : "bg-white/85";

  return (
    <header
      className={`read-hide sticky top-0 z-30 border-b border-stone-200 backdrop-blur-md transition-colors ${headerBg}`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="font-display text-lg font-semibold text-stone-900">{episodeTitle}</div>
          <MicIndicator state={recognizerState} confidence={confidence} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTimer}
            className={[
              "rounded-md px-3 py-1.5 font-mono text-sm font-semibold tracking-wider transition",
              statusBg[status],
              timerRunning ? "ring-2 ring-accent/40" : "",
            ].join(" ")}
            title="Timer Start/Pause (T) · Reset (R)"
            onDoubleClick={onResetTimer}
          >
            {formatTime(timerSecs)}
            {timerRange && (
              <span className="ml-1.5 text-[10px] font-normal opacity-60">
                / {Math.floor(timerRange.minSec / 60)}-{Math.floor(timerRange.maxSec / 60)}min
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-accent hover:text-accent"
            title="Vorherige Section (←)"
          >
            ←
          </button>
          <span className="font-mono text-sm text-stone-600">
            {currentIndex + 1} / {totalSections}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-accent hover:text-accent"
            title="Nächste Section (→)"
          >
            →
          </button>

          <button
            type="button"
            onClick={onToggleAutoFollow}
            className={[
              "ml-2 rounded-md border px-3 py-1.5 text-sm font-medium transition",
              autoFollow
                ? "border-accent bg-accent/10 text-accent-dark"
                : "border-stone-300 bg-white text-stone-700",
            ].join(" ")}
            title="Auto-Follow toggle (Space)"
          >
            Auto-Follow: {autoFollow ? "AN" : "AUS"}
          </button>

          {isListening ? (
            <button
              type="button"
              onClick={onStop}
              className="ml-2 rounded-md bg-stone-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-900"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="ml-2 rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
            >
              ▸ Start
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
