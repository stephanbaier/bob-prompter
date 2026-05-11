import type { Section } from "./types";

/**
 * German stop-words — common words that carry no topic signal.
 * Kept short and pragmatic; matched lowercase, no inflection handling.
 */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  "und", "oder", "aber", "doch", "denn", "weil", "dass", "ob", "wenn", "als",
  "der", "die", "das", "des", "dem", "den", "ein", "eine", "einer", "einen", "einem", "eines",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "dich", "uns", "euch", "ihm", "ihn", "ihnen", "mir", "dir",
  "ist", "sind", "war", "waren", "bin", "bist", "sein", "seine", "seiner", "ihren", "ihrem", "ihre", "ihrer",
  "hat", "haben", "habe", "hatte", "hatten", "wird", "werden", "wurde", "wurden", "kann", "können", "konnte", "könnte",
  "muss", "müssen", "musste", "soll", "sollen", "sollte", "will", "wollen", "wollte", "mag", "mögen", "darf", "dürfen",
  "in", "an", "auf", "bei", "mit", "nach", "von", "vom", "zu", "zum", "zur", "aus", "für", "um", "über", "unter", "vor",
  "hinter", "neben", "zwischen", "durch", "gegen", "ohne", "im", "am", "ans",
  "nicht", "kein", "keine", "keiner", "keinen", "auch", "nur", "schon", "noch", "mal", "sehr", "ganz", "etwa", "fast",
  "so", "wie", "was", "wer", "wo", "wann", "warum", "weshalb", "welche", "welcher", "welches",
  "dieser", "diese", "dieses", "diesem", "diesen", "jener", "jene", "jenes",
  "man", "ja", "nein", "naja", "okay", "ok", "yeah", "äh", "ähm",
  "hier", "da", "dort", "drauf", "drüber", "drin", "raus", "rein", "hin", "her",
  "mehr", "weniger", "viel", "wenig", "alle", "alles", "jede", "jeder", "jedes",
]);

export type Vocabulary = {
  /** Map word → { idf, sectionIds } */
  byWord: Map<string, { idf: number; sectionIds: Set<string> }>;
  /** Map sectionId → Set of vocabulary words (post-stopword) */
  bySection: Map<string, Set<string>>;
};

const WORD_RE = /\p{L}[\p{L}\d-]+/gu;

export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];
  for (const match of lower.matchAll(WORD_RE)) {
    const w = match[0];
    if (w.length < 3) continue;
    if (STOP_WORDS.has(w)) continue;
    tokens.push(w);
  }
  return tokens;
}

function gatherSectionText(section: Section): string {
  const parts: string[] = [section.title, section.contextHint ?? ""];
  // New slim fields
  if (section.juliaScript) parts.push(section.juliaScript);
  if (section.handoff) parts.push(section.handoff);
  if (section.thesis) parts.push(section.thesis);
  if (section.topicPreview) parts.push(...section.topicPreview);
  if (section.bullets) parts.push(...section.bullets);
  if (section.winsLosses) {
    parts.push(...section.winsLosses.map((wl) => `${wl.pick} ${wl.reason ?? ""}`));
  }
  // Verbatim + stats always
  if (section.verbatim) parts.push(...section.verbatim.map((v) => v.text));
  if (section.stats) parts.push(...section.stats.map((s) => `${s.label} ${s.value}`));
  // Anchors
  parts.push(...section.anchors);
  if (section.transitionAnchors) parts.push(...section.transitionAnchors);
  // Deprecated fallback (older JSON files still readable)
  if (section.intro) parts.push(section.intro);
  if (section.speakingPoints) parts.push(...section.speakingPoints.map((sp) => `${sp.label} ${sp.text}`));
  if (section.juliaInsider) parts.push(section.juliaInsider);
  if (section.editorialTake) parts.push(section.editorialTake);
  if (section.transition) parts.push(section.transition);
  return parts.join(" ");
}

export function buildVocabulary(sections: Section[]): Vocabulary {
  const bySection = new Map<string, Set<string>>();
  const docFreq = new Map<string, Set<string>>();

  for (const section of sections) {
    const words = new Set(tokenize(gatherSectionText(section)));
    bySection.set(section.id, words);
    for (const w of words) {
      let s = docFreq.get(w);
      if (!s) {
        s = new Set();
        docFreq.set(w, s);
      }
      s.add(section.id);
    }
  }

  const N = sections.length;
  const byWord = new Map<string, { idf: number; sectionIds: Set<string> }>();
  for (const [word, sectionIds] of docFreq.entries()) {
    // smoothed IDF: log(1 + N / df) — never zero, bounded
    const idf = Math.log(1 + N / sectionIds.size);
    byWord.set(word, { idf, sectionIds });
  }

  return { byWord, bySection };
}

/** Quick lookup: word → set of section indices that contain this word (with IDF) */
export type WordHit = { sectionIds: string[]; idf: number };

export function lookupWord(vocab: Vocabulary, word: string): WordHit | null {
  const entry = vocab.byWord.get(word);
  if (!entry) return null;
  return { sectionIds: Array.from(entry.sectionIds), idf: entry.idf };
}
