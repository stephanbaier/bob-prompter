# Build Prompts — Step-by-Step Ausführung

> Jeder Step ist ein in sich abgeschlossener Prompt, der an Claude Code gegeben werden kann. Reihenfolge ist verbindlich (Dependencies). Status pro Step updaten beim Durcharbeiten.

---

## Step 1 — Scaffold Next.js + Tailwind

**Status:** ☐ todo
**Outcome:** Next.js 14 App mit App Router + TypeScript + Tailwind unter `the-blueprint/podcast/bob-prompter/`, lokal startbar mit `bun dev`.

**Prompt:**

> Bootstrappe Next.js 14 mit App Router unter `the-blueprint/podcast/bob-prompter/`. Verwende bun als Package Manager.
>
> Konfiguration:
> - TypeScript strict mode
> - Tailwind CSS v3 mit warm-grey/orange Theme (Akzent `#FF5500`, Background-Stack auf Stone-50)
> - Inter als Body-Font (next/font), Bricolage Grotesque als Display-Font
> - `app/layout.tsx` mit `<html lang="de">` und Tailwind-Reset
> - `app/page.tsx` als Landing mit Liste der verfügbaren Folgen (initially nur F004)
> - `.gitignore` (Next.js Defaults + `.env*.local`)
>
> Schritt für Schritt:
> 1. `bun create next-app .` (Manual: TypeScript ja, ESLint ja, Tailwind ja, src dir nein, App Router ja, customize alias nein)
> 2. Fonts via `next/font/google` in layout.tsx
> 3. Tailwind theme.extend.colors mit `accent: '#FF5500'`
> 4. Stub `app/page.tsx` mit „BoB Prompter" Headline + Link zu `/f004`

**Verification:**
- `bun dev` läuft auf `localhost:3000` ohne Errors
- Browser zeigt „BoB Prompter" + Link
- `Cmd+R` reloaded, kein TS-Error in der Console

---

## Step 2 — Types + Episode-Schema

**Status:** ☐ todo
**Outcome:** `lib/types.ts` mit `Episode` + `Section` Typen, exportiert für alle Consumer.

**Prompt:**

> Erstelle `lib/types.ts` mit den TypeScript-Typen aus `IMPLEMENTATION_PLAN.md` (Sektion "JSON-Schema"). Konkret:
>
> ```typescript
> export type SpeakingPoint = {
>   label: string;
>   text: string;
>   source?: string;
> };
>
> export type Stat = {
>   label: string;
>   value: string;
>   source?: string;
> };
>
> export type VerbatimLine = {
>   speaker: "julia" | "stephan";
>   text: string;
> };
>
> export type Section = {
>   id: string;
>   element: number;
>   title: string;
>   lead: "julia" | "stephan" | "both";
>   durationHint?: string;
>   verbatim?: VerbatimLine[];
>   intro?: string;
>   speakingPoints?: SpeakingPoint[];
>   stats?: Stat[];
>   juliaInsider?: string;
>   editorialTake?: string;
>   transition?: string;
>   anchors: string[];
> };
>
> export type Episode = {
>   episode: string;
>   title: string;
>   recordedAt: string;
>   sections: Section[];
> };
> ```
>
> Plus: `lib/load-episode.ts` mit Funktion `loadEpisode(slug: string): Promise<Episode>` die das JSON aus `data/<slug>.json` per dynamic import lädt.

**Verification:**
- `import type { Episode } from '@/lib/types'` funktioniert in `app/page.tsx`
- `tsc --noEmit` ist clean

---

## Step 3 — F004-JSON manuell crafted

**Status:** ☐ todo
**Outcome:** `data/f004.json` mit allen 16 Sections (Element 1-16 des Goldstandard-Ablaufplans) inkl. Anchors. Themen-Sections initially mit Placeholder-Content (werden später ersetzt sobald Julia/Stephan Themen-Triade gesetzt haben).

**Prompt:**

> Erstelle `data/f004.json` als gültiges JSON nach `Episode`-Schema (`lib/types.ts`).
>
> Quelle für Section-Struktur: `the-blueprint/podcast/BoB_FOLGEN_ABLAUFPLAN.md` (15 Elemente + Callback-Bonus = 16 Sections).
>
> Pro Section:
> - `id`: kebab-case (z.B. `cold-open`, `greeting`, `thema-1`)
> - `element`: 1-16
> - `title`: aus Ablaufplan
> - `lead`: `julia` | `stephan` | `both`
> - `verbatim`: für Element 2 (Greeting), 4 (Pivot-Line), 13 (Show-Closer), 15 (Brand-Anker), 16 (Final Sign-off) → exakte Sätze aus dem Ablaufplan
> - `anchors`: 5-15 Match-Phrasen pro Section. Beispiele:
>   - Element 2 Greeting: `["hi zusammen", "business ohne bullshit", "julia jung", "stephan baier"]`
>   - Element 4 Pivot-Line: `["wie auch immer drei themen", "drei themen diese woche"]`
>   - Element 10 W/F: `["sieger und verlierer", "wer fängt diese woche an", "mein sieger", "mein verlierer"]`
>   - Element 13 Show-Closer: `["das wars für heute", "abonnier uns auf youtube", "mittwoch wieder da"]`
> - Themen 1-3: `title: "Thema 1: [TBD]"`, `intro: "Wird vor Aufnahme befüllt"`, `anchors: ["thema eins", "story eins"]` (werden später nach Themen-Setting ergänzt)
>
> Wichtige Sections (Reihenfolge): cold-open · greeting · banter · pivot-line · thema-1 (mit news-anchor + discussion + transition als sub-felder ODER eigene sections — entscheide pragmatisch) · thema-2 · thema-3 · sieger-verlierer · outro-beginn · show-closer · brand-anker · final-sign-off
>
> Für MVP: jedes Element = eine Section. Story-Sub-Steps (5.1-5.5) werden in Speaking Points der Thema-Section abgebildet, nicht als eigene Sections.

**Verification:**
- `JSON.parse(readFile('data/f004.json'))` wirft keinen Error
- Mind. 16 Sections vorhanden
- Pro Verbatim-Section: ≥3 Anchors
- Pro Themen-Section: ≥5 Anchors

---

## Step 4 — Recognizer-Wrapper (Web Speech API)

**Status:** ☐ todo
**Outcome:** `lib/recognizer.ts` exportiert Hook `useRecognizer()` der eine Subscription auf Speech-Events liefert.

**Prompt:**

> Erstelle `lib/recognizer.ts` als React-Hook-Wrapper um die Web Speech API.
>
> API:
> ```typescript
> type RecognizerState = "idle" | "listening" | "error" | "unsupported";
> type RecognizerEvent =
>   | { type: "interim"; text: string }
>   | { type: "final"; text: string }
>   | { type: "end" }
>   | { type: "error"; message: string };
>
> export function useRecognizer(opts: {
>   lang: string;                 // "de-DE"
>   onEvent: (e: RecognizerEvent) => void;
> }): {
>   state: RecognizerState;
>   start: () => void;
>   stop: () => void;
> };
> ```
>
> Verhalten:
> - Feature-Detection: wenn `window.SpeechRecognition` und `window.webkitSpeechRecognition` beide undefined → `state = "unsupported"`, `start()` no-op
> - `start()` legt neue `SpeechRecognition` an, setzt `continuous=true`, `interimResults=true`, `lang=opts.lang`
> - Auf `result`-Event: iteriere `event.results`, sende `{ type: "interim", text }` für non-final, `{ type: "final", text }` für final
> - Auf `end`-Event: wenn `state === "listening"` (wir wollten weiterhören) → automatischer Restart nach 100ms; sonst stop
> - Auf `error`-Event: sende `{ type: "error" }`, state = "error"
> - `stop()` setzt internes Flag, dann `recognition.stop()`
>
> Cleanup: useEffect-Return → stop + null-out recognition.

**Verification:**
- In `app/[folge]/page.tsx` Stub: Hook integriert, Console-log auf jedes Event
- Chrome lokal: vorlesen → interim+final Events in Console
- Firefox lokal: state = "unsupported"
- 5-Min-Test: Continuous Mode bleibt aktiv, auch nach Sprech-Pausen

---

## Step 5 — Matcher (Rolling-Window-Scoring)

**Status:** ☐ todo
**Outcome:** `lib/matcher.ts` exportiert reine Funktion `findBestSection(buffer, sections, currentIdx)` plus `useMatcher()` Hook.

**Prompt:**

> Erstelle `lib/matcher.ts` mit Pure-Function + Hook.
>
> Pure Function:
> ```typescript
> export type MatchResult = {
>   sectionId: string | null;
>   score: number;
>   shouldJump: boolean;
> };
>
> export function findBestSection(
>   transcriptBuffer: string,   // letzte ~15 Wörter, lowercase, normalisiert
>   sections: Section[],
>   currentIndex: number,
> ): MatchResult;
> ```
>
> Scoring:
> - Normalisiere Buffer + Anchors: lowercase, entferne Punctuation, mehrere Spaces zu einem
> - Pro Section: Score = 0
>   - Pro Anchor: wenn Anchor (als Phrase) im Buffer enthalten → addiere Score
>     - Multi-Word-Anchor (>=2 Wörter): +5
>     - Single-Word-Anchor: +1
>   - Wenn `section.verbatim` existiert UND Verbatim-Text-Substring im Buffer (mindestens 3 zusammenhängende Wörter): +10
> - Best Section: höchster Score
> - `shouldJump = true` wenn:
>   - `bestScore >= 3` AND `bestSectionIdx !== currentIndex` AND `bestSectionIdx > currentIndex`
>   - ODER `bestScore >= 8` AND `bestSectionIdx < currentIndex` (rückwärts nur bei hoher Confidence)
>
> Hook:
> ```typescript
> export function useMatcher(sections: Section[], onJump: (idx: number) => void): {
>   pushTranscript: (text: string, kind: "interim" | "final") => void;
>   confidence: "high" | "low";
> };
> ```
> - Hook hält internen Rolling-Buffer (15 Wörter, FIFO)
> - Final-Text: append + verdrängt
> - Interim-Text: replaces letzten interim-Chunk
> - Alle 500ms: ruft `findBestSection`, wenn `shouldJump` → `onJump(idx)`
> - Confidence wird "low" wenn 30 Sek lang kein Score-Increase

**Verification:**
- Unit-Test (oder Manual): Buffer `"hi zusammen das ist business ohne bullshit"` + Sections-Array → matched `greeting` mit Score ≥10
- Buffer `"random nonsense"` → score < 3, no jump
- Buffer matched bereits-vergangene Section mit Score 5 → no jump (Score < 8)

---

## Step 6 — UI: SectionCard + Prompter-Container

**Status:** ☐ todo
**Outcome:** `app/[folge]/page.tsx` lädt Episode, rendert alle SectionCards, Active highlighted, smooth-scroll.

**Prompt:**

> Implementiere die Prompter-View unter `app/[folge]/page.tsx`.
>
> Struktur:
> 1. Server-Component: lädt Episode via `loadEpisode(params.folge)`, passt an Client-Component weiter
> 2. Client-Component `<Prompter episode={...}>`:
>    - State: `activeIdx`, `autoFollow` (bool), `transcriptBuffer` (string)
>    - Hooks: `useRecognizer({ lang: "de-DE", onEvent })` + `useMatcher(sections, setActiveIdx)`
>    - Refs: pro Section ein `ref` für scroll-into-view
>    - Effect: bei `activeIdx`-Change → `ref.scrollIntoView({ behavior: 'smooth', block: 'center' })` IF autoFollow
>
> `<SectionCard section={...} isActive={...} onClick={...} ref={...}>`:
> - Wenn `isActive`: ring-2 ring-accent (orange #FF5500), bg-white, scale 1.0
> - Wenn !isActive: bg-stone-100, opacity-50, scale-95
> - Renders:
>   - Header: `Element {n} — {title}` + Lead-Badge (Julia/Stephan/Both)
>   - Wenn `verbatim`: Mono-Block mit Speaker-Label vor jeder Zeile
>   - Wenn `intro`: Paragraph
>   - Wenn `speakingPoints`: Numbered List, große Schrift (18px+)
>   - Wenn `stats`: Pill-Liste (`bg-stone-200 px-3 py-1 rounded-full`)
>   - Wenn `juliaInsider`: Quoted-Block mit Insider-Icon
>   - Wenn `editorialTake`: Italics-Block
>   - Wenn `transition`: Subtle muted Subtext am Ende
>
> Container-Layout:
> - Full-height, scrollable Container
> - Padding für visuelles Atmen
> - SectionCards vertikal gestapelt mit `space-y-6`
> - Max-Width `max-w-4xl` zentriert

**Verification:**
- `/f004` rendert alle 16 Sections
- Manuelles Setzen `activeIdx = 4` (via React Devtools oder Tastatur) → Card 4 scrollt smooth in center
- Active Card visuell klar abgesetzt

---

## Step 7 — UI: ControlBar + BrowserCheck + TranscriptDebug

**Status:** ☐ todo
**Outcome:** Sticky Header mit Controls + Footer mit Transcript-Debug + Browser-Check als Modal/Overlay.

**Prompt:**

> Drei Komponenten:
>
> **`<ControlBar>`** (sticky top):
> - Links: Episode-Title + Recording-Indicator (roter Pulse-Punkt wenn `state === "listening"`)
> - Mitte: Auto-Follow-Toggle (Button mit Icon + Label, grün wenn an, grau wenn aus)
> - Rechts: Manual-Nav (← → Buttons), Section-Counter `{activeIdx+1} / {sections.length}`
> - Tastatur-Handler: globales `useEffect` mit `keydown` Listener
>   - `↓` → activeIdx+1 (capped)
>   - `↑` → activeIdx-1 (capped)
>   - `Space` (wenn nicht in Input fokussiert) → toggle Auto-Follow
>
> **`<TranscriptDebug>`** (sticky bottom):
> - Zeigt letzte ~10 Wörter, monospace, klein (text-xs)
> - Hintergrund: bg-stone-900/80 + backdrop-blur
> - Wenn `confidence === "low"`: zusätzlich gelbes Warning-Icon + Tooltip „Low Confidence — kein Match seit 30s"
>
> **`<BrowserCheck>`** (Modal-Overlay, Mount-once):
> - Feature-detect `window.SpeechRecognition || window.webkitSpeechRecognition`
> - Wenn nicht unterstützt: Full-Screen-Overlay „Dieses Tool braucht Chrome oder Edge. Bitte öffne diese URL dort." + Link zum Chrome-Download
> - Wenn Mic-Permission verweigert wurde: Overlay „Mic-Zugriff erforderlich" + Re-Try-Button
>
> Alle drei in `<Prompter>` integrieren.

**Verification:**
- Chrome: kein BrowserCheck-Overlay, ControlBar live, TranscriptDebug zeigt erkannte Wörter
- Firefox: BrowserCheck-Overlay erscheint, blockt UI
- Mic-Verweigerung: Re-Try-Overlay zeigt sich
- `↓` Tastendruck: scrollt zu nächster Section
- Space: Auto-Follow Toggle animiert (grün ↔ grau)

---

## Step 8 — Local-Smoke-Test

**Status:** ☐ todo
**Outcome:** 30-Min-Test gegen lokales `bun dev`, dokumentierte Anchor-Tuning-Notes.

**Prompt:**

> Manueller Test (kein Code). Stephan führt durch:
>
> 1. `bun dev` starten, Chrome auf `localhost:3000/f004`
> 2. Mic-Permission granten
> 3. Test-Skript abspielen (selbst vorlesen, lautes Sprechen):
>    - „Hi zusammen, das ist Business ohne Bullshit, der Pod, von [Plattform]. Ich bin Julia Jung." → erwarte Jump auf `greeting`
>    - „Und ich bin Stephan Baier." → Jump bleibt auf `greeting`
>    - „Wie auch immer. Drei Themen diese Woche." → Jump auf `pivot-line`
>    - „Während wir aufnehmen, hat [Brand] verkündet…" → Jump auf `thema-1`
>    - 30 Sek Schweigen → Confidence-Indicator wechselt auf gelb
>    - `↓` drücken → Jump auf `thema-2`
>    - „Sieger und Verlierer der Woche" → Jump auf `sieger-verlierer`
>    - „Okay, das war's für heute. Danke fürs Zuhören und abonnier uns auf YouTube." → Jump auf `show-closer`
>
> Bei Fail: Anchors in `data/f004.json` anpassen (z.B. Synonyme hinzufügen, Stop-Words rausnehmen), Browser reloaden, retest.
>
> Dokumentiere Lessons in einer kurzen `lessons-smoke-test.md` (was matchte, was nicht, welche Anchors zugefügt wurden).

**Verification:**
- ≥7 von 8 Jumps automatisch korrekt
- Manual-Override funktioniert immer
- Keine Crashes in 30 Min

---

## Step 9 — GitHub-Repo + Vercel-Deploy

**Status:** ☐ todo
**Outcome:** Public URL erreichbar, auto-deploy aus GitHub aktiviert.

**Prompt:**

> Setup-Steps (User-Interaktion in Browser nötig — Stephan macht es manuell):
>
> 1. GitHub: neuen Public-Repo `stephanbaier/bob-prompter` anlegen
> 2. Lokal:
>    ```bash
>    cd the-blueprint/podcast/bob-prompter
>    git init
>    git add .
>    git commit -m "Initial: BoB Prompter MVP"
>    git remote add origin git@github.com:stephanbaier/bob-prompter.git
>    git branch -M main
>    git push -u origin main
>    ```
> 3. Vercel Dashboard → New Project → Import `stephanbaier/bob-prompter` → Default Build-Settings → Deploy
> 4. Nach Deploy: Custom Subdomain optional (Vercel-Settings → Domains)
> 5. URL teilen mit Julia per Mail mit Quickstart-Auszug aus README
>
> Wichtig: Vor Push prüfen, ob `data/f004.json` keine sensitiven Insider-Drops enthält (Repo ist public).

**Verification:**
- Vercel-URL erreichbar in Chrome (Incognito-Test)
- `/f004` lädt Episode
- Recognition läuft (Mic-Permission auf Vercel-Domain erlauben)

---

## Step 10 — Pre-Aufnahme Read-Through mit Julia

**Status:** ☐ todo
**Outcome:** Julia hat Tool getestet, Anchors finalisiert, GO/NO-GO für Aufnahme.

**Prompt:**

> Joint Session (Stephan + Julia, ~30 Min, Riverside-Test-Mode oder Video-Call):
>
> 1. Julia öffnet URL in Chrome, granted Mic
> 2. Stephan öffnet parallel auf seinem Laptop
> 3. Beide lesen abwechselnd das DOD-Test-Skript (siehe `DEFINITION_OF_DONE.md` „Pre-Aufnahme-Akzeptanz-Test")
> 4. Jeder Fail → Anchor-Tuning in `f004.json`, Stephan pusht, beide reloaden, Re-Test der gefailten Section
> 5. Iterate bis ≥6 von 7 Sprüngen automatisch korrekt
> 6. Julia bestätigt: UI scanbar, Verbatim-Phrasen erkennbar, Manual-Override intuitiv
> 7. GO/NO-GO für Aufnahme 13.05.
>
> Wenn NO-GO: nochmal verschieben oder Aufnahme manuell ohne Tool.

**Verification:**
- DOD-Checkliste „Pre-Aufnahme-Akzeptanz-Test" zu ≥85% abgehakt
- Julia signs off: „Würde damit aufnehmen"
- Anchors für F004 final committet

---

## Status-Übersicht

| # | Step | Status | Geschätzt | Tatsächlich |
|---|---|---|---|---|
| 1 | Scaffold Next.js + Tailwind | ☐ | 15 min | — |
| 2 | Types + Episode-Schema | ☐ | 15 min | — |
| 3 | F004-JSON manuell crafted | ☐ | 45 min | — |
| 4 | Recognizer-Wrapper | ☐ | 30 min | — |
| 5 | Matcher | ☐ | 45 min | — |
| 6 | UI: SectionCard + Prompter | ☐ | 60 min | — |
| 7 | UI: ControlBar + BrowserCheck + Debug | ☐ | 30 min | — |
| 8 | Local-Smoke-Test | ☐ | 30 min | — |
| 9 | GitHub + Vercel-Deploy | ☐ | 15 min | — |
| 10 | Pre-Aufnahme Read-Through Julia | ☐ | 30 min | — |
| **Total** | | | **~5 h** | — |

---

*v1.0 · 2026-05-11*
