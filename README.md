# BoB Live-Prompter

Live-Teleprompter für die Podcast-Aufnahme von **Business ohne Bullshit**. Zeigt pro Folge die Speaking Notes mit Active-Card-UX — Julia-Read-Texte, Stephan-Thesen, Stats und Bullets — auf einer fokussierten Karte. Optional läuft eine Mic-Recognition mit Auto-Follow im Hintergrund (Web Speech API + Claude-Haiku-Reality-Check), Primary-Navigation aber über Pfeiltasten.

**Live:** [bob-prompter.vercel.app](https://bob-prompter.vercel.app) · **Latest-Folge:** [/latest](https://bob-prompter.vercel.app/latest)

---

## Quickstart für Julia + Stephan

1. **Chrome oder Edge** öffnen (Safari/Firefox geht nicht — Web Speech API fehlt)
2. URL: `https://bob-prompter.vercel.app/latest` (Stephan schickt sie ~30 Min vor Aufnahme)
3. **Navigation** (das ist der primäre Pfad — Mic ist optional):
   - **`←` / `→`** → vorherige / nächste Section
   - **`↑` / `↓`** → Seite hoch / runter scrollen (Browser-Default)
   - **Click** auf Timeline-Chip oben → springt direkt hin
   - **`Space`** → Auto-Follow toggle (an/aus)
   - **`D`** → Debug-Drawer (Mic-Status, Section-Scores, LLM-Reality-Check)
4. **Optional — Mic-Auto-Follow:** Klick auf **„▸ Start"** oben rechts → Mic-Permission erlauben. Das Tool versucht dann passiv, der Stimme zu folgen. Latenz kann variieren (Web Speech API ist nicht deterministisch). Bei Hängern einfach Pfeiltasten benutzen.

---

## Architektur (Kurzform)

- **9-Section-Speaking-Notes-Layout** (ab F005): Greeting · Small Talk · Themen-Pivot · Topic 1/2/3 · Wins & Fails · Outro · Close. Cold Open wird post-production zusammengeschnitten, kommt nicht ins Tool.
- **Active-Card-UX:** Eine zentrale Karte zeigt die aktuelle Section komplett. `VORHER / JETZT / DANACH`-Marker oben, Slide-Up-Animation beim Wechsel. Kein Section-Stack mit Scroll-Through.
- **Pure-JS Matcher (alle 800ms):** Rolling-80-Word-Buffer + TF-IDF-Vokabular + Stickiness-Bonus + 2-Tick-Hysterese gegen Flicker. Schlägt vorwärts bei Score ≥ 5, rückwärts bei ≥ 12.
- **LLM Reality-Check (alle 20s):** Background-Call an Claude Haiku 4.5 (`/api/llm-classify`) mit den letzten ~60 Wörtern + Section-Metadata. Override bei Confidence ≥ 0.75 UND anderer Section. Fallback auf Pure-JS, wenn API-Key fehlt oder Endpoint nicht erreichbar.
- **Headless UI:** Mic-Indikator als dezentes Icon im Header (grün = aktiv, amber = low confidence, rot = error). Keine durchlaufende Transcript-Bar. Debug-Drawer optional via `D`.

---

## File-Struktur

```
bob-prompter/
├── README.md                       ← du bist hier
├── DEPLOY.md                       ← GitHub + Vercel-Workflow
├── IMPLEMENTATION_PLAN.md
├── USER_STORIES.md
├── DEFINITION_OF_DONE.md
├── BUILD_PROMPTS.md
├── .env.local                      ← lokal, gitignored, hält ANTHROPIC_API_KEY
├── .env.local.example
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← Home: Auto-Discovery aller data/*.json
│   ├── latest/page.tsx             ← Redirect zur neuesten Folge
│   ├── [folge]/page.tsx            ← Prompter-View
│   ├── api/llm-classify/route.ts   ← Claude-Haiku-Endpoint (Node-Runtime)
│   └── icon.tsx                    ← Generated Favicon
├── components/
│   ├── Prompter.tsx                ← Haupt-Container, Keybindings, LLM-Loop
│   ├── ActiveCard.tsx              ← Single zentrale Card mit Slide-Up
│   ├── Timeline.tsx                ← Horizontale Section-Chips
│   ├── UpNextPreview.tsx           ← Footer „Kommt als Nächstes"
│   ├── ControlBar.tsx              ← Header mit Start/Stop/Auto-Follow/Nav
│   ├── MicIndicator.tsx            ← Dezentes Mic-Status-Icon
│   ├── DebugDrawer.tsx             ← Toggle via D-Taste
│   └── BrowserCheck.tsx            ← Chrome-Warning-Overlay
├── lib/
│   ├── types.ts                    ← Episode + Section Schema
│   ├── recognizer.ts               ← Web Speech API Wrapper, Auto-Restart
│   ├── matcher.ts                  ← Pure-JS Matcher v2 (TF-IDF + Stickiness)
│   ├── vocab.ts                    ← Vocabulary-Builder + IDF
│   ├── llm-classify.ts             ← Client-Fetch-Helper
│   └── load-episode.ts             ← Server-side Auto-Discovery aus data/
└── data/
    ├── f003.json                   ← Test-Folge (Erewhon · Oura · AI-Layoff)
    ├── f004.json                   ← Placeholder-Folge
    └── f005.json                   ← Erste produzierte Folge
```

---

## Episode-Schema (kurz)

```typescript
type Section = {
  id: string;                        // greeting, topic-1, wins-fails, ...
  element: number;                   // 1-16 (15-Element-Architektur-Ref)
  title: string;
  lead: "julia" | "stephan" | "both";
  durationHint?: string;             // "6-12 Min"
  contextHint?: string;              // 1-Satz-Hint für LLM-Disambiguation

  verbatim?: { speaker, text }[];    // exakte Quotes (Greeting, Closer)
  juliaScript?: string;              // Was Julia konversationell vorliest
  thesis?: string;                   // Stephans These (1-2 Sätze, blue-Block)
  topicPreview?: string[];           // Pivot-Line: 3 Topic-Headlines
  bullets?: string[];                // Stats + Talking-Points (flach, ~1 Zeile)
  stats?: { label, value, source? }[];  // Pills (optional)
  winsLosses?: WinLossEntry[];       // farbcodierte Sieger/Verlierer

  anchors: string[];                 // Match-Keywords für Speech-Recognition
  transitionAnchors?: string[];      // Hochpräzise Exit/Entry-Phrasen (+15 Score)
}
```

Quelle der Wahrheit pro Folge sind zwei Markdown-Files in `the-blueprint/podcast/folgen/`:
- `F<NNN>_SPEAKING.md` — schlanke Teleprompter-Version (Format wie F005_SPEAKING)
- `F<NNN>_FOLGE.md` — volle Prosa-Version (Archiv / Show-Notes-Quelle)

Das JSON in `data/` wird aus dem `_SPEAKING.md` abgeleitet (heute manuell, künftig per Script).

---

## Neue Folge hinzufügen

Siehe **[DEPLOY.md](./DEPLOY.md)** für den kompletten Workflow.

Kurzform:
1. `the-blueprint/podcast/folgen/F<NNN>_SPEAKING.md` schreiben (Format wie F005_SPEAKING.md)
2. `data/f<nnn>.json` daraus ableiten (10 Sections, Anchors + transitionAnchors für Speech-Matching)
3. `recordedAt` auf höchstes Datum setzen → wird automatisch `/latest`
4. Commit + Push + `vercel deploy --prod --yes`

---

## Dev-Setup

```bash
cd the-blueprint/podcast/bob-prompter
bun install
cp .env.local.example .env.local
# ANTHROPIC_API_KEY in .env.local eintragen
bun dev   # http://localhost:3000
```

Optional ohne API-Key: Tool läuft trotzdem, nur ohne LLM-Reality-Check (Pure-JS Matcher reicht).

---

*v3.1 · 2026-05-11 · Speaking-Notes-Layout · Production-Deploy live unter bob-prompter.vercel.app*
