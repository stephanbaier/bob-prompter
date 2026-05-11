# Deploy & Folgen-Workflow

Wie der BoB-Prompter geliefert wird, wie neue Folgen reinkommen, wo was lebt.

---

## Production-Setup (einmalig, bereits gemacht)

| Komponente | Wert |
|---|---|
| **GitHub-Repo** | [`stephanbaier/bob-prompter`](https://github.com/stephanbaier/bob-prompter) (public) |
| **Vercel-Project** | `bob-prompter` unter Scope `stephan-baiers-projects` |
| **Production-URL** | https://bob-prompter.vercel.app |
| **Latest-Redirect** | `/latest` → höchstes `recordedAt` aus `data/*.json` |
| **ENV-Var (Prod)** | `ANTHROPIC_API_KEY` — gesetzt für `production` via `vercel env add` |
| **ENV-Var (lokal)** | `.env.local` im Repo-Root (gitignored, Stephans Key) |
| **GitHub-Auto-Deploy** | ❌ nicht verbunden (Vercel-CLI-Connect schlug einmal fehl) → manuell `vercel deploy --prod` |

---

## Standard-Update (neue Folge, Anchor-Tuning, Bugfix)

```bash
cd /Users/sb/the-blueprint/podcast/bob-prompter

# 1. Änderungen lokal verifizieren
bun dev    # http://localhost:3000
# … Pfeile testen, Mic-Permission, /latest checken …

# 2. Type-Check + Sanity-Tests
bunx tsc --noEmit

# 3. Commit + Push (GitHub bleibt versioniert)
git add -A
git commit -m "F006: Microsoft Q2 Buyout aftermath / Anchor-Tuning T3"
git push

# 4. Production-Deploy (manuell — kein Auto-Deploy)
vercel deploy --prod --yes
# Liefert: https://bob-prompter.vercel.app (Alias) + ein deployment-spezifischer URL
```

**~30-40 Sekunden** Build-Zeit auf Vercel. Browser-Hard-Reload für Cache-Bust.

---

## Neue Folge dazu — Schritt für Schritt

### 1. Editorial-Files erstellen (in `the-blueprint/podcast/folgen/`)

Pro Folge **zwei** MD-Files:

| File | Zweck |
|---|---|
| `F<NNN>_SPEAKING.md` | **Teleprompter-Quelle.** Schlank, nur Vorlese-Texte + Stats-Bullets + `VORHER/JETZT/DANACH`-Marker. |
| `F<NNN>_FOLGE.md` | **Volle Folge.** Ausgeschriebene Prosa, Punchline-Pool, Brand-Safety, Macro-Library. |

**SPEAKING.md-Format** (1:1 wie F005_SPEAKING.md):

```markdown
# F006 — Speaking Notes (Teleprompter)
> 2026-05-13 · Volle Folge: `F006_FOLGE.md` · Architektur: `BoB_FOLGEN_ABLAUFPLAN.md` v1.0

---

## Greeting
`VORHER: — | JETZT: Begrüßung | DANACH: Small Talk`

**Julia:** „Hi zusammen…"
**Stephan:** „Und ich bin Stephan Baier."

---

## Topic 1 — [Title]
`VORHER: Pivot | JETZT: Topic 1 | DANACH: Topic 2`

**Julia liest:**
„…"

**Stephan — These:**
[1-2 Sätze]

**Stats:**
- [Fact / Number]
- [Fact / Number]

**Julia Übergang → Topic 2:** frei
```

9 Sections (ab F005): Greeting · Small Talk · Themen-Pivot · Topic 1/2/3 · Wins & Fails · Outro · Close.

### 2. JSON ableiten — `bob-prompter/data/f<nnn>.json`

1:1 Mirror der SPEAKING.md, plus:
- `anchors: []` — 10-30 Phrasen pro Section, die Julia/Stephan wahrscheinlich sagen
- `transitionAnchors: []` — 3-5 hochpräzise Exit/Entry-Trigger (z.B. „während wir aufnehmen", „erstens microsoft")
- `recordedAt: "YYYY-MM-DD"` — höchstes Datum wird automatisch `/latest`

Beispiel-Section:
```json
{
  "id": "topic-1",
  "element": 5,
  "title": "Topic 1 — [Title]",
  "lead": "stephan",
  "durationHint": "6-12 Min",
  "contextHint": "1-Satz-Hint für LLM-Disambiguation",
  "juliaScript": "Was Julia vorliest …",
  "thesis": "Stephans These in 1-2 Sätzen.",
  "bullets": [
    "Stat 1 als Bullet (mit Zahl + Quelle)",
    "Stat 2",
    "…"
  ],
  "anchors": ["..."],
  "transitionAnchors": ["..."]
}
```

### 3. Live-Sanity vor Deploy

```bash
bun dev
# /<nnn> öffnen, Timeline durchklicken, Speech testen wenn Mic gewünscht
bunx tsc --noEmit
```

### 4. Deploy (siehe Standard-Update oben)

```bash
git add data/f<nnn>.json the-blueprint/podcast/folgen/F<NNN>_SPEAKING.md
git commit -m "F<NNN>: [Topic-Triade-Beschreibung]"
git push
vercel deploy --prod --yes
```

`/latest` zeigt automatisch auf die neue Folge.

---

## Pre-Aufnahme-Checklist

- [ ] Julia hat `https://bob-prompter.vercel.app/latest` in Chrome geöffnet
- [ ] Mic-Permission erlaubt (Optional — Pfeile reichen)
- [ ] Pre-Read-Through: alle 9 Sections durchklicken via `→`-Pfeile, Stats checken, „Julia liest"-Blöcke vorlesen
- [ ] Stephan-Thesen mit These-Block-Inhalt abgleichen
- [ ] Wenn was unstimmig: SPEAKING.md + JSON-Mirror anpassen, redeploy
- [ ] Riverside-Session bereit
- [ ] USB-Mic, Headphones, Chrome-Tab nicht im Vollbild (sonst kein Multi-Window)

---

## Troubleshooting

**Latest zeigt falsche Folge:**
- `recordedAt` in `data/f<nnn>.json` checken — höchstes Datum gewinnt
- Hard-Reload (`Cmd+Shift+R`) für Vercel-Cache

**Mic-Indicator bleibt grau / kein Match:**
- Chrome-URL-Leiste → Mic-Icon-Berechtigung prüfen
- Tool nutzt Web Speech API (Google STT) → Internet-Verbindung Pflicht
- Bei Latenz: einfach Pfeile benutzen, Mic ist optional

**LLM-Reality-Check feuert nicht:**
- Debug-Drawer (`D`) checken: „LLM Reality-Check" zeigt Status
- Wenn „skipped: ANTHROPIC_API_KEY not configured" → ENV-Var auf Vercel fehlt:
  ```bash
  vercel env add ANTHROPIC_API_KEY production
  vercel deploy --prod --yes
  ```

**Section-Wechsel scrollt nicht:**
- Beim Pfeil-Druck: `scrollIntoView` auf ActiveCard läuft → wenn nicht, Browser-Fokus prüfen (kein Input/Textarea-Element im Fokus)

---

## Phase 2 (nach den ersten Folgen)

- **GitHub-Auto-Deploy aktivieren** via Vercel-Dashboard → Project Settings → Git → Connect Repository. Erspart manuelles `vercel deploy --prod`.
- **Lokales Whisper** statt Web Speech API: niedrigere Latenz, offline, kein Audio zu Google. Setup-Aufwand ~halber Tag (whisper.cpp WASM oder lokaler Python-Service via WebSocket).
- **MD-to-JSON-Converter**: Script, das `F<NNN>_SPEAKING.md` automatisch in `data/f<nnn>.json` umwandelt. Anchor-Generierung aus Stats + Brand-Namen.
- **Riverside-Integration**: Live-Transcript direkt vom Riverside-Stream statt vom Mic.

---

*Stand 2026-05-11 · v3.1*
