export type Stat = {
  label: string;
  value: string;
  source?: string;
};

export type VerbatimLine = {
  speaker: "julia" | "stephan";
  text: string;
};

export type WinLossEntry = {
  who: "julia" | "stephan";
  type: "sieger" | "verlierer";
  pick: string;
  reason?: string;
};

/** @deprecated old verbose schema — kept for backwards-compat reading */
export type SpeakingPoint = {
  label: string;
  text: string;
  source?: string;
};

export type Section = {
  id: string;
  element: number;
  title: string;
  lead: "julia" | "stephan" | "both";
  durationHint?: string;
  contextHint?: string;

  /** Verbatim phrases (Greeting, Pivot-Line, Closer, etc.) */
  verbatim?: VerbatimLine[];

  /** What Julia reads aloud — conversational, 1-3 sentences, Julia-style */
  juliaScript?: string;

  /** Optional: separate handoff question to Stephan (if not in juliaScript) */
  handoff?: string;

  /** Stephan's These (1-2 Sätze) — die Macro-Aussage zum Topic */
  thesis?: string;

  /** Pivot-Line only: 1-liner per topic, in Julia's voice */
  topicPreview?: string[];

  /** Compact bullet list for the lead host's content. Max ~10 words per bullet. */
  bullets?: string[];

  /** Number-pills */
  stats?: Stat[];

  /** Wins/Losses section only */
  winsLosses?: WinLossEntry[];

  /** Match-keywords */
  anchors: string[];

  /** High-precision exit/entry phrases (+15 score) */
  transitionAnchors?: string[];

  // --- Deprecated old fields (kept for backwards-compat, no longer rendered) ---
  /** @deprecated use juliaScript / bullets instead */
  intro?: string;
  /** @deprecated use bullets instead */
  speakingPoints?: SpeakingPoint[];
  /** @deprecated rolled into bullets */
  juliaInsider?: string;
  /** @deprecated rolled into bullets */
  editorialTake?: string;
  /** @deprecated transition is now just a small footer indicator */
  transition?: string;
  /** @deprecated */
  notes?: string;
};

export type Episode = {
  episode: string;
  title: string;
  recordedAt: string;
  sections: Section[];
};
