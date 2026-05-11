# BoB Live-Prompter

Live-Teleprompter für die Podcast-Aufnahme von **Business ohne Bullshit**. Hört über das Mic mit, erkennt anhand von Anchor-Keywords + Kontext, welche Section gerade läuft, scrollt automatisch zu den passenden Speaking Notes + Stat-Drops. Beide Hosts (Julia + Stephan) öffnen ihre eigene URL in Chrome — null Friction, kein Notion-Scrolling während Aufnahme.

**Status:** V1 · Aufnahme F004 am Mi 13.05.2026

---

## Quickstart Julia

1. URL in **Chrome** öffnen (Stephan schickt sie): `https://bob-prompter.vercel.app/latest`
2. Klick auf **„▸ Start"** oben rechts → Chrome fragt nach Mic-Permission → erlauben
3. Headphones auf, losgehen — das Tool scrollt selbst zur aktuellen Section

**Manuelle Navigation** (wenn nötig):
- `↓` Pfeiltaste → nächste Section
- `↑` Pfeiltaste → vorherige Section
- `Space` → Auto-Follow toggle (an/aus)
- Klick auf Section in der Liste → springt direkt hin
- `D` → Debug-Drawer (für Stephan, zeigt erkannte Wörter + LLM-Status)

**Browser:** Nur **Chrome** oder **Edge**. Safari/Firefox können kein Web Speech API.

---

## Architektur (Kurzform)

- **Pure-JS Matcher (alle ~800ms):** rolling 80-Word-Buffer, scoring mit Anchors + TF-IDF + Transition-Triggers + Stickiness. Sprung erst nach 2 konsekutiven Tick-Bestätigungen.
- **LLM Reality-Check (alle 20s):** Background-Call an Claude Haiku 4.5, der die letzten ~60 Wörter + Section-Metadata bekommt und klassifiziert. Wenn Confidence ≥75% UND andere Section → Override.
- **Headless UI:** Mic-Status nur als dezentes Icon im Header (grün-pulse aktiv, gelb low-confidence, rot Fehler). Keine durchlaufende Transcript-Bar. Debug auf `D`.

---

## Quickstart Stephan (Build/Update)

### Setup einmalig

```bash
cd the-blueprint/podcast/bob-prompter
bun install
cp .env.local.example .env.local
# Trag deinen Anthropic API Key in .env.local ein
```

### Dev

```bash
bun dev                # http://localhost:3000
```

### Neue Folge hinzufügen

```bash
# 1. Vorlage kopieren
cp data/f004.json data/f005.json

# 2. Felder anpassen: episode, title, recordedAt
$EDITOR data/f005.json

# 3. Themen-Inhalte, Speaking Points, Stats, Anchors, transitionAnchors ergänzen
# (Pro Section mind. 5 Anchors + 3 transitionAnchors für sauberes Matching)

# 4. Push → Vercel deployed automatisch (~30s)
git add data/f005.json
git commit -m "F005: $(date +%Y-%m-%d)"
git push
```

Tool zeigt automatisch die neueste Folge (nach `recordedAt`-Datum) als „AKTUELL" auf der Home-Page. `/latest` redirected direkt dorthin.

### Anchor-Tuning

Beim Tunen pro Section:
- **`anchors`** — normale Match-Phrasen, breit (Multi-Word +5, Single +1)
- **`transitionAnchors`** — hochpräzise Exit/Entry-Phrasen (+15), z.B. „egal weiter im programm"
- **`verbatim`** — exakte Sätze (4-Gram-Match → +10)
- **`contextHint`** — 1-Satz-Beschreibung für LLM-Disambiguation

Lokal testen mit `bun dev`, dann pushen.

---

## File-Struktur

```
bob-prompter/
├── README.md                     ← du bist hier
├── IMPLEMENTATION_PLAN.md        ← Architektur + MVP-Scope
├── USER_STORIES.md
├── DEFINITION_OF_DONE.md
├── BUILD_PROMPTS.md
├── .env.local.example            ← API-Key-Template
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← Home: Folgen-Liste + AKTUELL-Badge
│   ├── latest/page.tsx           ← Redirect zur neuesten Folge
│   ├── [folge]/page.tsx          ← Prompter-View
│   ├── api/llm-classify/route.ts ← LLM Reality-Check Endpoint
│   └── icon.tsx                  ← Generated Favicon
├── components/
│   ├── Prompter.tsx              ← Haupt-Container, integriert Matcher + LLM
│   ├── SectionCard.tsx
│   ├── ControlBar.tsx
│   ├── MicIndicator.tsx          ← Dezentes Mic-Icon im Header
│   ├── DebugDrawer.tsx           ← Optional, via D-Taste
│   └── BrowserCheck.tsx
├── lib/
│   ├── types.ts                  ← Episode/Section-Schema
│   ├── recognizer.ts             ← Web Speech API wrapper
│   ├── matcher.ts                ← Pure-JS Matcher v2 (TF-IDF + Stickiness)
│   ├── vocab.ts                  ← Vocabulary-Builder + IDF
│   ├── llm-classify.ts           ← Client-Fetch zum API-Endpoint
│   └── load-episode.ts           ← Server-side Auto-Discovery aus data/
└── data/
    └── f004.json                 ← Episode-Daten, ein File pro Folge
```

---

## Deployment auf Vercel

1. GitHub-Repo `stephanbaier/bob-prompter` erstellen
2. `git push -u origin main`
3. Vercel Dashboard → Import Project → Connect Repo → Deploy
4. **Project Settings → Environment Variables → `ANTHROPIC_API_KEY`** setzen
5. Re-Deploy triggern (sonst läuft Tool ohne LLM, Pure-JS only)

---

## Goldstandard für Section-Struktur

Quelle: `the-blueprint/podcast/BoB_FOLGEN_ABLAUFPLAN.md` v1.0 (15-Element-Architektur)

Aktive Sections in F004 (12): cold-open · greeting · banter · pivot-line · thema-1 · thema-2 · thema-3 · sieger-verlierer · outro-beginn · show-closer · brand-anker · final-sign-off

Inaktive (Pre-Launch-Phase): mid-roll-tease (8), re-open (9), cross-promo (11), production-credits (14, ab F006)

---

*v1.0 · 2026-05-11*
