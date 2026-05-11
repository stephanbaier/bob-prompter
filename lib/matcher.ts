"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Section } from "./types";
import { buildVocabulary, tokenize, type Vocabulary } from "./vocab";

// --- Scoring constants ---

export const SCORE_MULTI_WORD_ANCHOR = 5;
export const SCORE_SINGLE_WORD_ANCHOR = 1;
export const SCORE_VERBATIM_BOOST = 10;
export const SCORE_TRANSITION_ANCHOR = 15;

export const STICKINESS_PER_TICK = 4;
export const TICK_INTERVAL_MS = 800;
export const DECAY_PER_TICK = 0.85;

export const MIN_ABSOLUTE_SCORE = 5;
export const FORWARD_MARGIN = 1.5;     // best must be 1.5× current
export const BACKWARD_MIN_SCORE = 12;
export const CONFIRMATION_TICKS = 2;   // winner must repeat across N ticks

export const TRANSCRIPT_WINDOW_WORDS = 80;
export const LOW_CONFIDENCE_TIMEOUT_MS = 30_000;

// --- Normalization helpers ---

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[„""''`]/g, "")
    .replace(/[.,!?;:()\-—…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(s: string): number {
  return s.length === 0 ? 0 : s.split(/\s+/).length;
}

// --- Scoring result types ---

export type SectionScore = {
  sectionId: string;
  score: number;
  /** Position weighting: 0..1 — how recent are the hits (1 = right now) */
  recency: number;
};

export type EvaluationResult = {
  scores: SectionScore[];
  topId: string | null;
  topIndex: number;
};

// --- Match against a buffer with positional weighting ---

/**
 * Score sections against a buffer. Words near the end (recent speech) are
 * weighted higher than words at the start (older). Returns full score map.
 */
export function scoreBuffer(
  buffer: string,
  sections: Section[],
  vocab: Vocabulary,
): Map<string, number> {
  const normBuf = normalize(buffer);
  const padded = ` ${normBuf} `;
  const tokens = normBuf.split(/\s+/).filter(Boolean);
  const tokenCount = tokens.length;

  // Map token-index → positional weight (linear ramp from 0.3 to 1.0)
  // Token at the very end = weight 1.0, oldest = 0.3
  const tokenWeight = (idx: number) =>
    tokenCount <= 1 ? 1 : 0.3 + 0.7 * (idx / (tokenCount - 1));

  // Pre-compute token-positions of each unique word for vocab lookups
  const wordPositions = new Map<string, number[]>();
  tokens.forEach((tok, idx) => {
    let arr = wordPositions.get(tok);
    if (!arr) {
      arr = [];
      wordPositions.set(tok, arr);
    }
    arr.push(idx);
  });

  const scores = new Map<string, number>();
  for (const section of sections) scores.set(section.id, 0);

  for (const section of sections) {
    let score = 0;

    // Normal anchors
    for (const anchor of section.anchors) {
      const norm = normalize(anchor);
      if (!norm) continue;
      const pad = ` ${norm} `;
      // count occurrences (could be multiple)
      let from = 0;
      while (true) {
        const i = padded.indexOf(pad, from);
        if (i < 0) break;
        // Map char-index back to token-position for recency weighting
        const beforeStr = padded.slice(0, i);
        const tokIdx = beforeStr.split(/\s+/).filter(Boolean).length;
        const recency = tokenWeight(Math.min(tokIdx, tokenCount - 1));
        const base = countWords(norm) >= 2 ? SCORE_MULTI_WORD_ANCHOR : SCORE_SINGLE_WORD_ANCHOR;
        score += base * recency;
        from = i + pad.length - 1;
      }
    }

    // Transition anchors (high-precision exit/entry triggers)
    if (section.transitionAnchors) {
      for (const anchor of section.transitionAnchors) {
        const norm = normalize(anchor);
        if (!norm) continue;
        const pad = ` ${norm} `;
        let from = 0;
        while (true) {
          const i = padded.indexOf(pad, from);
          if (i < 0) break;
          const beforeStr = padded.slice(0, i);
          const tokIdx = beforeStr.split(/\s+/).filter(Boolean).length;
          const recency = tokenWeight(Math.min(tokIdx, tokenCount - 1));
          score += SCORE_TRANSITION_ANCHOR * recency;
          from = i + pad.length - 1;
        }
      }
    }

    // Verbatim 4-gram boost
    if (section.verbatim) {
      for (const line of section.verbatim) {
        const words = normalize(line.text).split(/\s+/).filter(Boolean);
        if (words.length < 4) continue;
        for (let w = 0; w <= words.length - 4; w++) {
          const fourGram = ` ${words.slice(w, w + 4).join(" ")} `;
          if (padded.includes(fourGram)) {
            score += SCORE_VERBATIM_BOOST;
            break; // one verbatim hit per line is plenty
          }
        }
      }
    }

    // TF-IDF vocabulary signal: per token, add IDF if it belongs to this section
    // Bonus for words with high IDF (rare across corpus)
    const sectionVocab = vocab.bySection.get(section.id);
    if (sectionVocab && tokenCount > 0) {
      let vocabScore = 0;
      for (const [word, positions] of wordPositions.entries()) {
        if (!sectionVocab.has(word)) continue;
        const entry = vocab.byWord.get(word);
        if (!entry) continue;
        // Use first occurrence's position-weight (cheap)
        const recency = tokenWeight(positions[0]!);
        vocabScore += entry.idf * recency * 0.5;
      }
      score += vocabScore;
    }

    scores.set(section.id, score);
  }

  return scores;
}

// --- React hook ---

export type Confidence = "high" | "low";

export type UseMatcherOptions = {
  sections: Section[];
  currentIndex: number;
  enabled: boolean;
  onMatch: (newIndex: number) => void;
};

export type UseMatcherReturn = {
  pushTranscript: (text: string, kind: "interim" | "final") => void;
  resetInterim: () => void;
  /** External jump notification (e.g. LLM override or manual) */
  notifyExternalJump: (newIndex: number) => void;
  confidence: Confidence;
  bufferPreview: string;
  topScores: SectionScore[];
  rollingTranscript: string;
};

export function useMatcher(opts: UseMatcherOptions): UseMatcherReturn {
  const { sections, currentIndex, enabled, onMatch } = opts;

  // Vocabulary computed once per sections-set
  const vocab = useMemo(() => buildVocabulary(sections), [sections]);

  // Rolling buffer: array of words, last 80
  const wordsRef = useRef<string[]>([]);
  const interimRef = useRef<string>("");

  // Accumulated scores per section (smoothed across ticks)
  const accumulatedRef = useRef<Map<string, number>>(new Map(sections.map((s) => [s.id, 0])));

  // Hysterese state
  const candidateWinnerRef = useRef<string | null>(null);
  const candidateCountRef = useRef<number>(0);

  // Current-index mirror for inside-the-tick
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const onMatchRef = useRef(onMatch);
  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  // Public state
  const [confidence, setConfidence] = useState<Confidence>("high");
  const [topScores, setTopScores] = useState<SectionScore[]>([]);
  const [bufferPreview, setBufferPreview] = useState("");
  const lastMatchTsRef = useRef(Date.now());

  // Reset accumulator when sections change
  useEffect(() => {
    accumulatedRef.current = new Map(sections.map((s) => [s.id, 0]));
    candidateWinnerRef.current = null;
    candidateCountRef.current = 0;
  }, [sections]);

  const evaluate = useCallback(() => {
    const buffer = [...wordsRef.current, ...tokenize(interimRef.current)].join(" ");
    setBufferPreview(buffer);

    if (!enabledRef.current || sectionsRef.current.length === 0) return;

    // Decay accumulated scores
    for (const [k, v] of accumulatedRef.current.entries()) {
      accumulatedRef.current.set(k, v * DECAY_PER_TICK);
    }

    // Score buffer fresh
    const fresh = scoreBuffer(buffer, sectionsRef.current, vocab);

    // Merge: accumulated = decayed + fresh (the fresh score IS the current evidence)
    // Easier: replace decayed with max(decayed, fresh) so fresh strong signal wins
    for (const [k, v] of fresh.entries()) {
      const cur = accumulatedRef.current.get(k) ?? 0;
      // Take a weighted blend so old evidence doesn't get instantly erased
      accumulatedRef.current.set(k, Math.max(cur * 0.7, v));
    }

    // Apply stickiness bonus to current section
    const currId = sectionsRef.current[currentIndexRef.current]?.id;
    if (currId) {
      accumulatedRef.current.set(
        currId,
        (accumulatedRef.current.get(currId) ?? 0) + STICKINESS_PER_TICK,
      );
    }

    // Determine winner
    const entries: SectionScore[] = sectionsRef.current.map((s, idx) => ({
      sectionId: s.id,
      score: accumulatedRef.current.get(s.id) ?? 0,
      recency: idx === currentIndexRef.current ? 1 : 0,
    }));
    entries.sort((a, b) => b.score - a.score);
    setTopScores(entries.slice(0, 4));

    const winner = entries[0];
    const current = entries.find((e) => sectionsRef.current.findIndex((s) => s.id === e.sectionId) === currentIndexRef.current);
    if (!winner || !current) return;

    if (winner.score > 0) {
      lastMatchTsRef.current = Date.now();
      setConfidence("high");
    }

    const winnerIdx = sectionsRef.current.findIndex((s) => s.id === winner.sectionId);
    if (winnerIdx === currentIndexRef.current) {
      candidateWinnerRef.current = null;
      candidateCountRef.current = 0;
      return;
    }

    // Apply jump gates
    const absoluteOk = winner.score >= MIN_ABSOLUTE_SCORE;
    const marginOk = winner.score > current.score * FORWARD_MARGIN || current.score < 1;
    const isForward = winnerIdx > currentIndexRef.current;
    const backwardOk = !isForward ? winner.score >= BACKWARD_MIN_SCORE : true;

    if (!(absoluteOk && marginOk && backwardOk)) {
      candidateWinnerRef.current = null;
      candidateCountRef.current = 0;
      return;
    }

    // Confirmation across ticks
    if (candidateWinnerRef.current === winner.sectionId) {
      candidateCountRef.current += 1;
    } else {
      candidateWinnerRef.current = winner.sectionId;
      candidateCountRef.current = 1;
    }

    if (candidateCountRef.current >= CONFIRMATION_TICKS) {
      candidateWinnerRef.current = null;
      candidateCountRef.current = 0;
      // Reset accumulator for the new section so we don't immediately bounce
      accumulatedRef.current.set(winner.sectionId, winner.score);
      onMatchRef.current(winnerIdx);
    }
  }, [vocab]);

  const pushTranscript = useCallback(
    (text: string, kind: "interim" | "final") => {
      if (kind === "final") {
        const newTokens = tokenize(text);
        const merged = [...wordsRef.current, ...newTokens];
        wordsRef.current =
          merged.length > TRANSCRIPT_WINDOW_WORDS
            ? merged.slice(merged.length - TRANSCRIPT_WINDOW_WORDS)
            : merged;
        interimRef.current = "";
      } else {
        interimRef.current = text;
      }
    },
    [],
  );

  const resetInterim = useCallback(() => {
    interimRef.current = "";
  }, []);

  const notifyExternalJump = useCallback((newIndex: number) => {
    candidateWinnerRef.current = null;
    candidateCountRef.current = 0;
    // Boost the new section so subsequent ticks don't immediately revert
    const newId = sectionsRef.current[newIndex]?.id;
    if (newId) accumulatedRef.current.set(newId, 8);
  }, []);

  // Tick interval
  useEffect(() => {
    const id = setInterval(() => evaluate(), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [evaluate]);

  // Confidence decay timer
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - lastMatchTsRef.current;
      if (elapsed > LOW_CONFIDENCE_TIMEOUT_MS) setConfidence("low");
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const rollingTranscript = wordsRef.current.slice(-60).join(" ");

  return {
    pushTranscript,
    resetInterim,
    notifyExternalJump,
    confidence,
    bufferPreview,
    topScores,
    rollingTranscript,
  };
}
