# Implementation Plan

## Context

Bei der Aufnahme von **Business ohne Bullshit** (erste echte Folge F004 am **Mi 13.05.2026**) sollen Julia und Stephan nicht mehr in Notion scrollen müssen. Stattdessen läuft ein **Live-Prompter** als Browser-Tab nebenbei: Er hört über das USB-Mic mit, erkennt anhand von Anchor-Keywords, in welcher Section des Folgen-Ablaufplans wir gerade sind, und scrollt automatisch zu den passenden Speaking Notes + Stat-Drops. Beide Hosts sind remote (Riverside), jeder auf eigenem Laptop. Das Tool ist eine **hosted Web-App** (Vercel), die Julia per URL öffnet — null Friction, Chrome auf + Mic erlauben + Go.

**Ziel:** Mi 13.05. aufnahmebereit. MVP-Scope, klar erweiterbar.

---

## Architektur

```
┌──────────────────┐         ┌──────────────────┐
│ Julia's Chrome   │         │ Stephan's Chrome │
│  · /f004         │         │  · /f004         │
│  · USB-Mic       │         │  · USB-Mic       │
│  · Web Speech →  │         │  · Web Speech →  │
│    Google STT    │         │    Google STT    │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         └──── Static Web-App ────────┘
              (Next.js, Vercel)
                    │
                    ▼
              data/f004.json
              (committed, redeployed bei Update)
```

**Pro Host:** Eigene Recognition, eigener Mic, eigene Scroll-Position. **Kein Sync nötig** — beide laufen unabhängig.

---

## Tech Stack

- **Next.js 14 App Router** (TypeScript) — Vercel-native
- **Tailwind** (warm-grey/orange, Amakori-Style)
- **Web Speech API** (`SpeechRecognition`, `de-DE`, continuous mode, interim results)
- **Static JSON** pro Folge unter `/data/f<NNN>.json`
- **Vercel Hosting** (free tier)
- **Keine Backend-API, keine DB.** Alles client-side.

**Browser:** Chrome oder Edge (Web Speech API). Firefox/Safari werden im UI explizit blockiert.

---

## File-Struktur

```
the-blueprint/podcast/bob-prompter/
├── README.md
├── IMPLEMENTATION_PLAN.md         ← du bist hier
├── USER_STORIES.md
├── DEFINITION_OF_DONE.md
├── BUILD_PROMPTS.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .gitignore
├── app/
│   ├── layout.tsx
│   ├── page.tsx                   (Index: Folgen-Liste)
│   └── [folge]/page.tsx           (Prompter-View pro Folge)
├── components/
│   ├── Prompter.tsx               (State-Hub)
│   ├── SectionCard.tsx            (active/dimmed states)
│   ├── ControlBar.tsx             (Start/Stop, Auto-Follow, Nav)
│   ├── TranscriptDebug.tsx        (letzte 10 Wörter)
│   └── BrowserCheck.tsx           (Chrome-Warning)
├── lib/
│   ├── types.ts                   (EpisodeSchema, SectionSchema)
│   ├── recognizer.ts              (Web Speech Wrapper)
│   ├── matcher.ts                 (Rolling-Window Anchor-Matching)
│   └── load-episode.ts            (JSON-Loader)
├── data/
│   └── f004.json
└── scripts/
    └── md-to-json.ts              (Phase 2)
```

**Eigener Git-Repo** (`bob-prompter` auf GitHub) → Vercel-Auto-Deploy aus GitHub-Hook.

---

## JSON-Schema (pro Folge)

```typescript
type Section = {
  id: string;                              // "thema-1", "cold-open"
  element: number;                         // 1-16 (15-Element-Architektur)
  title: string;
  lead: "julia" | "stephan" | "both";
  durationHint?: string;                   // "6-12 min"
  verbatim?: { speaker: string; text: string }[];  // greeting, closer
  intro?: string;                          // 1-2 Sätze Worum-geht's
  speakingPoints?: {
    label: string;
    text: string;
    source?: string;
  }[];
  stats?: { label: string; value: string; source?: string }[];
  juliaInsider?: string;
  editorialTake?: string;
  transition?: string;
  anchors: string[];                       // Match-Keywords (5-15 Stück)
};

type Episode = {
  episode: string;                         // "F004"
  title: string;
  recordedAt: string;
  sections: Section[];
};
```

**`anchors` ist der Schlüssel:** Pro Section 5-15 Anker-Phrasen — Titel-Keywords, Stat-Begriffe, Verbatim-Phrasen, Brand-Namen.

---

## Matching-Algorithmus

**Input:** Rolling Buffer der letzten ~15 erkannten Wörter (interim + final).

**Pro Tick (~500ms):**
1. Pro Section: Score berechnen
   - Exact-phrase match (mehrere Wörter in Reihe): **+5**
   - Single-keyword match: **+1**
   - Match auf Verbatim-Text: **+10** (greeting, closer — sehr eindeutig)
2. Best Score gewinnt — wenn `bestScore >= 3` AND `bestSection != currentSection`:
   - Vorwärts-Sprung: **smooth scroll**
   - Rückwärts-Sprung: nur wenn Score **>= 8** (verhindert Flicker)
3. Decay: Window-Wörter fade out → Section bleibt active solange passend

**Failure-Mode:** 30 Sek lang kein Match >threshold → "Low Confidence"-Indicator, kein Scroll.

**Manual Override:**
- `↑` / `↓` Pfeiltasten
- `Space` → Auto-Follow Toggle
- Click auf Section → Jump

---

## UI-Design

```
┌─────────────────────────────────────────────────────────────────┐
│ F004 · Recording  [● Live]  Auto-Follow [ON]  ← →  [J/S/All]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Element 4 — Pivot-Line (Julia) ──────────────────┐ ← active │
│  │ „Wie auch immer. Drei Themen diese Woche."        │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌─ Element 5 — Thema 1: [TITEL] ────────────────────┐          │
│  │ Lead: Julia · Time-Anchor: ...                    │          │
│  │ Speaking Points (Stephan):                         │          │
│  │  1. Hook — [...] · Quelle: [...]                  │          │
│  │  2. Framework — [...]                              │          │
│  │ Julia-Insider: „[...]"                             │          │
│  │ Editorial-Take: „[...]"                            │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌─ Element 7 — Übergang ────────────────────────────┐ (dimmed) │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 🎤 letzte 10 Wörter: „...die layoff zahlen sind absurd…"        │
└─────────────────────────────────────────────────────────────────┘
```

**Design-Prinzipien:**
- Active Section: vergrößert, orange Akzent-Border, weißer Hintergrund
- Next/Prev: dimmed (50% Opacity)
- Verbatim: Mono-Font, schwarz auf hellgrau
- Speaking Points: numbered, 18px+ für 60cm-Lesbarkeit
- Stats: Pill-Style, scanbar
- Smooth-Scroll mit ~250ms ease-out
- Mic-Indicator: roter Pulse-Punkt
- Transcript-Debug-Bar unten: letzte 10 Wörter klein/grau

**Style:** Amakori warm-grey/orange (`#FF5500`), Inter (Body), Bricolage (Headlines).

---

## MVP-Scope (Mi 13.05.2026)

**Muss drin:**
- Web Speech API Recognition (`de-DE`, continuous)
- Rolling-Window Anchor-Matcher
- Auto-Scroll + smooth-scroll
- Manual Override (↑/↓/Space/Click)
- F004 JSON mit allen 16 Sections + Anchors
- Chrome-Browser-Check + Mic-Permission-UI
- Transcript-Debug-Bar
- Vercel-Deploy unter öffentlicher URL
- Disclaimer im UI ("Audio geht zu Google")

**Bewusst NICHT im MVP:**
- Notion-API Live-Sync
- Per-Host Visual-Filter
- Whisper-Backend
- Mobile-Layout
- Multi-Episoden-Index
- Show-Notes-Export
- MD→JSON Auto-Converter

---

## Phase 2 (nach F004)

- Markdown→JSON Converter
- Notion-API Live-Pull
- Per-Host Visual-Filter (Julia/Stephan-Toggle)
- Whisper-Adapter (Privacy)
- Stats-Side-Panel
- Session-Recording-Export (Timestamps → Show-Notes-Draft)

---

## Build- / Deploy-Workflow

**Initial-Setup (einmalig):**
1. GitHub-Repo: `stephanbaier/bob-prompter`
2. `git init && git remote add origin git@github.com:stephanbaier/bob-prompter.git`
3. Vercel Dashboard → Import Repo → Default Build-Settings
4. Optional Custom Domain später

**Folgen-Update-Workflow:**
1. Julia + Stephan füllen `F<NNN>_TEMPLATE.md` (in `the-blueprint/podcast/folgen/`)
2. Stephan exportiert manuell oder per Script → `bob-prompter/data/f<NNN>.json`
3. `git commit && git push` → Vercel deployed (~30 Sek)
4. Beide reloaden URL

---

## Verification

**Lokaler Test:**
1. `bun dev` → `localhost:3000/f004` in Chrome
2. Mic erlauben
3. „Hi zusammen, das ist Business ohne Bullshit, der Pod" → springt auf **Element 2**
4. „Wie auch immer, drei Themen diese Woche" → **Element 4**
5. `↓` drücken → **Thema 1**
6. 30 Sek still → "Low Confidence"-Indicator, kein Scroll

**Production-Test (Vercel):**
1. URL teilen mit Julia
2. 5-Min-Read-Through gemeinsam
3. Anchors-Tuning bei Bedarf

**Akzeptanz F004:**
- ≥70% Section-Wechsel automatisch erkannt
- Manual-Override binnen 1 Sek möglich
- 90 Min Stabilität, kein Crash

---

## Risiko-Vorbehalte

1. **Web Speech API Stabilität:** Continuous mode auf Mac Chrome >5 Min variabel. Fallback: Polling-Restart alle 4 Min.
2. **Latenz:** Web Speech ~500ms-1s. Tool hängt leicht hinterher.
3. **Audio-Bleed:** Julia hört Stephan via Boxen → ihr Mic könnte falsche Triggers liefern. Lösung: Headphones (eh Pflicht), Mic-Schwellwert.
4. **Vercel-Public-URL:** JSON ist öffentlich lesbar. Insider-Drops vor Aufnahme anonymisieren (Brand-Safety-Regel gilt eh).

---

## Kritische Files (Referenzen)

- `the-blueprint/podcast/folgen/F004_TEMPLATE.md` — Datenquelle für `f004.json`
- `the-blueprint/podcast/BoB_FOLGEN_ABLAUFPLAN.md` — 15-Element-Architektur
- `the-blueprint/podcast/pivot/12_DUO_TENSION_MAP.md` — Rollen-Vokabular für Anchors

---

*v1.0 · 2026-05-11 · Plan-Source: `/Users/sb/.claude/plans/sunny-marinating-hoare.md`*
