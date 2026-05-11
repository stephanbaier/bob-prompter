# User Stories

## Personas

### Julia (Host, non-tech)
- **Rolle:** Reporter-Slot, Kara-Äquivalent. Eröffnet Stories, führt durch die Folge.
- **Tech-Affinität:** Mittel — kann Browser und Notion, aber kein Setup auf der Kommandozeile.
- **Aufnahme-Setup:** Remote auf eigenem Laptop, USB-Mic, Headphones, Chrome offen.
- **Hauptbedarf:** Null-Friction-Zugang zum Tool. Will sich aufs Sprechen konzentrieren, nicht auf UI.

### Stephan (Host + Builder)
- **Rolle:** Pundit-Slot, Scott-Äquivalent. Reagiert mit Macro-Frameworks + Stat-Drops.
- **Tech-Affinität:** Hoch — baut, deployed, maintained das Tool.
- **Aufnahme-Setup:** Remote auf eigenem Laptop, USB-Mic, Headphones, Chrome offen, ggf. zweiter Monitor.
- **Hauptbedarf:** Speaking Notes + Stats müssen scanbar sein während er spricht. Plus: Tool muss zwischen Folgen schnell update-bar sein.

---

## Story-Backlog

### US-1 — Null-Friction-Onboarding für Julia

> **Als** Julia
> **will ich** das Tool nur über eine URL + Mic-Permission öffnen können,
> **damit** ich vor der Aufnahme kein Tech-Setup brauche.

**Akzeptanz:**
- URL öffnet in Chrome ohne Login, ohne Konto, ohne Installation
- Bei erstem Klick auf „Start": Mic-Permission-Dialog von Chrome erscheint
- Nach Erlaubnis: Tool ist sofort live, ohne Reload

**Priorität:** P0 (MVP)

---

### US-2 — Automatisches Section-Following

> **Als** beide Hosts
> **wollen wir**, dass das Tool den aktuellen Section-Wechsel anhand unserer Pivot-Phrasen, Stat-Drops und Brand-Namen automatisch erkennt,
> **damit** wir nicht selbst scrollen müssen.

**Akzeptanz:**
- Verbatim-Phrasen wie „Wie auch immer. Drei Themen diese Woche." triggern Sprung in ≥95% der Fälle
- Themen-Wechsel über Anchor-Keywords (Brand-Namen, Stat-Drops) treffen ≥70%
- Smooth-Scroll mit ~250ms ease-out (kein abruptes Springen)

**Priorität:** P0 (MVP)

---

### US-3 — Editierbare Anchors pro Section

> **Als** Stephan
> **will ich** für jede Section die Anchor-Keywords als JSON editieren können,
> **damit** ich Match-Quality vor jeder Folge tunen kann.

**Akzeptanz:**
- `data/f<NNN>.json` ist das Single-Source-of-Truth für Sections + Anchors
- Edit + commit + push → Vercel deployed in ≤60 Sek
- Browser-Reload zeigt neuen Stand sofort

**Priorität:** P0 (MVP)

---

### US-4 — Manual Override per Tastatur und Click

> **Als** beide Hosts
> **wollen wir** Pfeiltasten + Click-to-Jump,
> **damit** wir bei Recognition-Fail in <1 Sek manuell zur richtigen Section springen.

**Akzeptanz:**
- `↓` → nächste Section
- `↑` → vorherige Section
- `Space` → Auto-Follow Toggle (an/aus mit visuellem Indikator)
- Click auf beliebige Section in der Liste → springt sofort hin
- Manual-Jump deaktiviert Auto-Follow nicht (außer Space)

**Priorität:** P0 (MVP)

---

### US-5 — Verbatim-Phrasen auf einen Blick

> **Als** Julia
> **will ich** die festen Verbatim-Phrasen (Begrüßung, Pivot-Line, Show-Closer, Sign-off) in einer klar abgesetzten Optik sehen,
> **damit** ich sie nicht aus dem Kopf zitieren muss.

**Akzeptanz:**
- Verbatim-Texte in Mono-Font, gerahmt, dunkler Hintergrund
- Speaker-Label vor jeder Verbatim-Zeile (Julia / Stephan)
- Visuell klar unterscheidbar von „freien" Speaking Points

**Priorität:** P0 (MVP)

---

### US-6 — Scanbare Stat-Drops für Stephan

> **Als** Stephan
> **will ich** Stat-Drops pro Thema groß und in einer Pill-/Tag-Optik sehen,
> **damit** ich beim Sprechen die Zahlen treffe ohne sie aus Speaking Notes herauszufiltern.

**Akzeptanz:**
- Stats als horizontale Pill-Liste: `[Stat-Label: Stat-Value]`
- Source-Reference klein darunter
- Mind. 18px Text für 60cm-Lesbarkeit

**Priorität:** P0 (MVP)

---

### US-7 — Mic-Indicator und Transcript-Debug

> **Als** Host
> **will ich** einen visuellen Mic-Indicator + die letzten 10 erkannten Wörter,
> **damit** ich sofort sehe ob das Tool mich überhaupt hört.

**Akzeptanz:**
- Roter Pulse-Punkt im UI wenn Recognition läuft
- Transcript-Bar unten zeigt rolling letzte ~10 Wörter
- Wenn 30 Sek kein Match: „Low Confidence"-Hinweis im UI

**Priorität:** P0 (MVP)

---

### US-8 — Pre-Aufnahme Lokal-Test

> **Als** Stephan
> **will ich** lokal mit `bun dev` testen können,
> **damit** ich vor jeder Folge die Anchors gegen Probe-Audio (selbst-vorgelesene Sätze) tunen kann.

**Akzeptanz:**
- `bun dev` startet ohne Setup-Schritte (nach `bun install`)
- Local-URL liefert identisches Verhalten wie Vercel
- Code-Änderungen werden in <2 Sek hot-reloaded

**Priorität:** P0 (MVP)

---

### US-9 — Stabile Recognition über 90 Min (Phase 2)

> **Als** beide Hosts
> **wollen wir**, dass das Tool über 90 Min Aufnahme stabil läuft, auch wenn Web Speech API zwischenzeitlich timeouts hat,
> **damit** wir mittendrin nicht den Tab neu laden müssen.

**Akzeptanz:**
- Continuous Mode hält ≥90 Min durch
- Bei Recognition-End-Event: Auto-Restart in <500ms
- Verlorene Tokens während Restart-Window werden nicht als Section-Trigger gewertet

**Priorität:** P1 (nach F004, falls F004-Aufnahme Probleme zeigt)

---

### US-10 — Notion-Live-Sync (Phase 2)

> **Als** Julia
> **will ich**, dass das Tool die Notion-Folgen-Seite live lädt,
> **damit** ich Themen-Änderungen direkt in Notion machen kann ohne Stephan zu pingen.

**Akzeptanz:**
- Tool ruft Notion-API beim Start mit Page-ID
- Markdown-Parser extrahiert Sections automatisch
- Anchor-Generierung aus Section-Titles + Stat-Keywords

**Priorität:** P2 (Phase 2)

---

### US-11 — Whisper-Adapter (Phase 3)

> **Als** beide Hosts
> **wollen wir** die Option, lokales Whisper statt Web Speech zu nutzen,
> **damit** sensitive Insider-Drops nicht zu Google gehen.

**Akzeptanz:**
- Recognizer-Interface ist abstrakt (Web Speech | Whisper)
- Whisper-Adapter via WebSocket-Bridge oder WASM
- Toggle im UI: „Recognition: Web Speech / Whisper"

**Priorität:** P3 (wenn Privacy-Bedenken oder Quality-Issues entstehen)

---

## Priorisierungs-Matrix

| Story | Priorität | Aufwand | F004-blockierend? |
|---|---|---|---|
| US-1 Julia-Onboarding | P0 | S | Ja |
| US-2 Auto-Following | P0 | M | Ja |
| US-3 Editierbare Anchors | P0 | S | Ja |
| US-4 Manual Override | P0 | S | Ja |
| US-5 Verbatim-Phrasen | P0 | S | Ja |
| US-6 Stat-Drops | P0 | S | Ja |
| US-7 Mic-Indicator + Debug | P0 | S | Ja |
| US-8 Lokal-Test | P0 | XS | Ja |
| US-9 90-Min-Stabilität | P1 | M | Nein |
| US-10 Notion-Sync | P2 | L | Nein |
| US-11 Whisper-Adapter | P3 | L | Nein |

**MVP für F004 = US-1 bis US-8.**

---

*v1.0 · 2026-05-11*
