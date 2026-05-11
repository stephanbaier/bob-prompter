"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/types";
import { useRecognizer, type RecognizerEvent } from "@/lib/recognizer";
import { useMatcher } from "@/lib/matcher";
import { classifyTranscript } from "@/lib/llm-classify";
import ControlBar from "./ControlBar";
import ActiveCard from "./ActiveCard";
import Timeline from "./Timeline";
import UpNextPreview from "./UpNextPreview";
import BrowserCheck from "./BrowserCheck";
import DebugDrawer, { type LlmDebugInfo } from "./DebugDrawer";

type Props = {
  episode: Episode;
};

const LLM_INTERVAL_MS = 20_000;
const LLM_OVERRIDE_THRESHOLD = 0.75;
const LLM_MIN_WORDS = 20;

const HINT_DISMISSED_KEY = "bob-prompter:hint-dismissed";

export default function Prompter({ episode }: Props) {
  const sections = episode.sections;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);
  const [llmDebug, setLlmDebug] = useState<LlmDebugInfo>({ lastCallAt: null, lastResult: null });

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(HINT_DISMISSED_KEY);
      setHintDismissed(stored === "1");
    } catch {
      setHintDismissed(false);
    }
  }, []);

  const dismissHint = () => {
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const matcherRef = useRef<{
    pushTranscript: (text: string, kind: "interim" | "final") => void;
    notifyExternalJump: (idx: number) => void;
  } | null>(null);

  const cardWrapRef = useRef<HTMLDivElement | null>(null);

  // On section change, scroll the active card into view (top, not center)
  useEffect(() => {
    const el = cardWrapRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  const handleRecognizerEvent = useCallback((e: RecognizerEvent) => {
    if (e.type === "interim") {
      matcherRef.current?.pushTranscript(e.text, "interim");
    } else if (e.type === "final") {
      matcherRef.current?.pushTranscript(e.text, "final");
    } else if (e.type === "error") {
      setErrorMsg(e.message);
    } else if (e.type === "start") {
      setErrorMsg(null);
    }
  }, []);

  const { state, start, stop, isSupported } = useRecognizer({
    lang: "de-DE",
    onEvent: handleRecognizerEvent,
  });

  const handleMatch = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  const matcher = useMatcher({
    sections,
    currentIndex,
    enabled: autoFollow,
    onMatch: handleMatch,
  });

  useEffect(() => {
    matcherRef.current = matcher;
  }, [matcher]);

  // Keyboard handlers — Main nav: ← → switches sections, ↑ ↓ scrolls page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (isEditable) return;

      if (e.key === "ArrowRight" || e.key === "l") {
        e.preventDefault();
        setCurrentIndex((idx) => Math.min(sections.length - 1, idx + 1));
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        e.preventDefault();
        setCurrentIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setAutoFollow((v) => !v);
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setDebugOpen((v) => !v);
      }
      // ↑ ↓ falls through to browser-default page scroll — no preventDefault
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sections.length]);

  // LLM Reality-Check every 20s
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const autoFollowRef = useRef(autoFollow);
  useEffect(() => {
    autoFollowRef.current = autoFollow;
  }, [autoFollow]);

  useEffect(() => {
    if (state !== "listening") return;
    let cancelled = false;
    const id = setInterval(async () => {
      const transcript = matcher.rollingTranscript;
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      if (wordCount < LLM_MIN_WORDS) return;
      const currId = sectionsRef.current[currentIndexRef.current]?.id;
      if (!currId) return;
      const result = await classifyTranscript({
        transcript,
        sections: sectionsRef.current,
        currentSectionId: currId,
      });
      if (cancelled) return;
      const ts = Date.now();
      if ("error" in result) {
        setLlmDebug({ lastCallAt: ts, lastResult: `❌ ${result.error.slice(0, 80)}` });
        return;
      }
      if ("skipped" in result) {
        setLlmDebug({ lastCallAt: ts, lastResult: `⊘ ${result.reason}` });
        return;
      }
      const summary = `${result.sectionId} (${(result.confidence * 100).toFixed(0)}%) — ${result.reasoning}`;
      setLlmDebug({ lastCallAt: ts, lastResult: summary });

      if (
        autoFollowRef.current &&
        result.confidence >= LLM_OVERRIDE_THRESHOLD &&
        result.sectionId !== currId
      ) {
        const targetIdx = sectionsRef.current.findIndex((s) => s.id === result.sectionId);
        if (targetIdx >= 0) {
          matcherRef.current?.notifyExternalJump(targetIdx);
          setCurrentIndex(targetIdx);
        }
      }
    }, LLM_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [state, matcher.rollingTranscript]);

  const onPrev = () => setCurrentIndex((idx) => Math.max(0, idx - 1));
  const onNext = () => setCurrentIndex((idx) => Math.min(sections.length - 1, idx + 1));
  const toggleAutoFollow = () => setAutoFollow((v) => !v);

  const activeSection = sections[currentIndex];

  return (
    <>
      <BrowserCheck />
      <ControlBar
        episodeTitle={episode.episode}
        recognizerState={state}
        autoFollow={autoFollow}
        onToggleAutoFollow={toggleAutoFollow}
        onPrev={onPrev}
        onNext={onNext}
        onStart={start}
        onStop={stop}
        currentIndex={currentIndex}
        totalSections={sections.length}
        confidence={matcher.confidence}
      />

      <Timeline
        sections={sections}
        currentIndex={currentIndex}
        onSelect={(i) => setCurrentIndex(i)}
      />

      {errorMsg && (
        <div className="mx-auto mt-3 max-w-5xl rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <strong>Recognizer:</strong> {errorMsg} — Tool versucht automatisch neu zu starten.
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6">
        {mounted && !isSupported && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            Speech Recognition wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge nutzen.
          </div>
        )}
        {mounted && state === "idle" && isSupported && !hintDismissed && (
          <div className="mb-4 flex items-start gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <span className="flex-1">
              👋 <strong>Navigation:</strong>{" "}
              <kbd>←</kbd> / <kbd>→</kbd> wechselt Section ·{" "}
              <kbd>↑</kbd> / <kbd>↓</kbd> scrollt die Seite ·{" "}
              <kbd>Space</kbd> toggelt Auto-Follow ·{" "}
              <kbd>D</kbd> öffnet Debug. Mic-Auto-Follow optional: Klick auf{" "}
              <strong>„▸ Start"</strong>.
            </span>
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Hinweis schließen"
              className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {activeSection && (
          <div ref={cardWrapRef} className="scroll-mt-32">
            <ActiveCard
              section={activeSection}
              index={currentIndex}
              prevTitle={currentIndex > 0 ? (sections[currentIndex - 1]?.title ?? null) : null}
              nextTitle={
                currentIndex < sections.length - 1
                  ? (sections[currentIndex + 1]?.title ?? null)
                  : null
              }
            />
          </div>
        )}
      </main>

      <UpNextPreview sections={sections} currentIndex={currentIndex} onJumpNext={onNext} />

      <DebugDrawer
        open={debugOpen}
        onClose={() => setDebugOpen(false)}
        bufferPreview={matcher.bufferPreview}
        topScores={matcher.topScores}
        sections={sections}
        llm={llmDebug}
      />
    </>
  );
}
