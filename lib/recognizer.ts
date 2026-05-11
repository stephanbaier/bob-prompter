"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- Browser-side type declarations (not in standard lib.dom) ---
// These are minimal but typesafe — we only access what we use.

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// --- Public hook API ---

export type RecognizerState = "idle" | "starting" | "listening" | "error" | "unsupported";

export type RecognizerEvent =
  | { type: "interim"; text: string }
  | { type: "final"; text: string }
  | { type: "start" }
  | { type: "end" }
  | { type: "error"; message: string };

export type UseRecognizerOptions = {
  lang: string;
  onEvent: (e: RecognizerEvent) => void;
};

export type UseRecognizerReturn = {
  state: RecognizerState;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
};

const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed"]);
const RESTART_DELAY_MS = 250;

function getCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useRecognizer(opts: UseRecognizerOptions): UseRecognizerReturn {
  const { lang, onEvent } = opts;
  const [state, setState] = useState<RecognizerState>("idle");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wantsListeningRef = useRef(false);
  const onEventRef = useRef(onEvent);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = typeof window !== "undefined" && getCtor() !== null;

  // Keep latest callback without recreating recognition instance
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Initial unsupported flag
  useEffect(() => {
    if (!isSupported) {
      setState("unsupported");
    }
  }, [isSupported]);

  const buildRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const Ctor = getCtor();
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setState("listening");
      onEventRef.current({ type: "start" });
    };

    rec.onresult = (event) => {
      // Walk only the newly-arrived results to avoid spamming interim duplicates
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || result.length === 0) continue;
        const transcript = result[0]?.transcript ?? "";
        if (!transcript.trim()) continue;
        if (result.isFinal) {
          onEventRef.current({ type: "final", text: transcript });
        } else {
          onEventRef.current({ type: "interim", text: transcript });
        }
      }
    };

    rec.onerror = (event) => {
      const err = event.error;
      onEventRef.current({ type: "error", message: err });
      if (FATAL_ERRORS.has(err)) {
        wantsListeningRef.current = false;
        setState("error");
      }
      // Non-fatal errors (no-speech, audio-capture, network): let onend trigger auto-restart
    };

    rec.onend = () => {
      onEventRef.current({ type: "end" });
      if (wantsListeningRef.current) {
        // Continuous mode hiccup — restart after short delay
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!wantsListeningRef.current || !recognitionRef.current) return;
          try {
            recognitionRef.current.start();
          } catch (err) {
            // Already started or other state issue — recover next tick
            console.warn("Restart failed, retrying", err);
          }
        }, RESTART_DELAY_MS);
      } else {
        setState("idle");
      }
    };

    return rec;
  }, [lang]);

  const start = useCallback(() => {
    if (!isSupported) {
      setState("unsupported");
      return;
    }
    if (wantsListeningRef.current) return;
    wantsListeningRef.current = true;
    setState("starting");

    if (!recognitionRef.current) {
      recognitionRef.current = buildRecognition();
    }
    if (!recognitionRef.current) {
      setState("unsupported");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // "InvalidStateError" if already started — safe to ignore, we'll get onstart
      console.warn("start() threw:", err);
    }
  }, [buildRecognition, isSupported]);

  const stop = useCallback(() => {
    wantsListeningRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantsListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return { state, start, stop, isSupported };
}
