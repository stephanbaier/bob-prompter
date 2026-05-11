# Definition of Done

## Pro User Story

### US-1 — Null-Friction-Onboarding für Julia
- [ ] Vercel-URL ist erreichbar ohne Auth/Login
- [ ] Erstaufruf in Chrome zeigt Landing mit „Start"-Button
- [ ] Klick auf „Start" triggert nativen Chrome-Mic-Dialog
- [ ] Nach Mic-Grant ist Recognition aktiv ohne weiteren Klick
- [ ] Wenn User Mic verweigert: klare Fehlermeldung + Re-Try-Button

**Test:** Julia öffnet URL aus dem Briefing-Mail in Chrome auf ihrem MacBook → kann in <30 Sek live sein.

---

### US-2 — Automatisches Section-Following
- [ ] Recognition läuft im `de-DE`-Locale, continuous mode, interim+final
- [ ] Matcher-Score-Funktion implementiert: exact-phrase=+5, single-word=+1, verbatim=+10
- [ ] Smooth-Scroll auf Active Section (~250ms ease-out)
- [ ] Rückwärts-Sprünge nur bei Score ≥8 (kein Flicker)
- [ ] Verbatim-Phrasen treffen ≥95% in lokalem Read-Through-Test
- [ ] Themen-Wechsel treffen ≥70% in 5-Min-Test

**Test:** Stephan liest 5 Min lang aus dem F004-JSON vor → Tool folgt Section-Wechseln korrekt.

---

### US-3 — Editierbare Anchors pro Section
- [ ] `data/f<NNN>.json` ist Single-Source-of-Truth
- [ ] JSON-Schema dokumentiert in `IMPLEMENTATION_PLAN.md`
- [ ] Edit + commit + push → Vercel deployed in ≤60 Sek
- [ ] Browser-Hard-Reload zeigt neuen Stand

**Test:** Stephan ändert einen Anchor, pusht, reloaded — neuer Anchor matcht beim nächsten Vorlesen.

---

### US-4 — Manual Override per Tastatur und Click
- [ ] `↓` springt zur nächsten Section, scrollt smooth
- [ ] `↑` springt zur vorherigen
- [ ] `Space` toggelt Auto-Follow mit visuellem Indicator (an=grün, aus=grau)
- [ ] Click auf beliebige Section-Card → Jump
- [ ] Auto-Follow bleibt aktiv nach Manual-Jump (außer bei Space-Toggle)

**Test:** Julia drückt ↓ während Auto-Follow läuft → springt manuell, Auto-Follow bleibt an.

---

### US-5 — Verbatim-Phrasen auf einen Blick
- [ ] Verbatim-Texte rendern in Mono-Font (e.g. JetBrains Mono)
- [ ] Visuell gerahmt mit dunklerem Hintergrund (#1a1a1a oder Tailwind `bg-stone-900`)
- [ ] Speaker-Label vor jeder Zeile (`Julia:` / `Stephan:`)
- [ ] Klar unterscheidbar von Speaking Points (andere Font, anderer Background)

**Test:** Julia sieht Element 2 (Greeting) und Element 13 (Show-Closer) sofort als „eingerahmt + Mono-Font" wieder.

---

### US-6 — Scanbare Stat-Drops für Stephan
- [ ] Stats rendern als horizontale Pill-Liste innerhalb Section-Card
- [ ] Format pro Pill: `[Label: Value]`
- [ ] Source-Reference als kleiner Subtext darunter (10px, grau)
- [ ] Mind. 18px Schriftgröße für Label+Value (60cm-Lesbarkeit)

**Test:** Stephan sieht in Thema 1 alle Stats auf einen Blick, ohne den Section-Text zu scrollen.

---

### US-7 — Mic-Indicator und Transcript-Debug
- [ ] Roter Pulse-Punkt im Header wenn Recognition aktiv
- [ ] Sticky Transcript-Bar am unteren Bildschirmrand
- [ ] Bar zeigt rolling letzte ~10 Wörter (interim+final gemixt)
- [ ] Wenn 30 Sek kein Match: Header-Indicator wechselt auf gelb + Tooltip „Low Confidence"

**Test:** Stephan murmelt 30 Sek random → Tool wechselt Indicator auf gelb, kein Auto-Scroll.

---

### US-8 — Pre-Aufnahme Lokal-Test
- [ ] `bun install` läuft fehlerfrei (oder npm/pnpm)
- [ ] `bun dev` startet Next.js auf `localhost:3000` ohne weitere Config
- [ ] Hot-Reload bei Code-Änderung in <2 Sek
- [ ] Lokal funktioniert identisch zur Vercel-Version (kein Build-Time-only-Feature)

**Test:** Stephan klont Repo neu auf zweitem Mac → `bun install && bun dev` → läuft.

---

## MVP-Cut für Aufnahme Mi 13.05.2026

**Hard-Requirements (alles muss erfüllt sein, sonst Aufnahme ohne Tool):**

- [ ] **Vercel-Deployment** live unter `bob-prompter.vercel.app/f004`
- [ ] **F004-JSON** vollständig mit allen 16 Sections (auch leere mit korrekter Struktur + Anchors)
- [ ] **Verbatim-Recognition:** Greeting („Hi zusammen, das ist Business ohne Bullshit") + Pivot-Line („Wie auch immer, drei Themen") + Show-Closer („Okay, das war's für heute") matchen ≥95% in 3-Versuche-Test
- [ ] **Themen-Wechsel:** 3 Themen mit je ≥5 unterschiedlichen Anchor-Phrasen → ≥70% Match-Rate in 5-Min-Test
- [ ] **Manual-Override** funktioniert lückenlos: alle 4 Aktionen (↑, ↓, Space, Click) bestanden
- [ ] **Browser-Check:** Firefox/Safari zeigen Warning, Chrome/Edge laufen
- [ ] **Mic-Permission-UX:** Verweigerter Mic-Zugriff zeigt verständliche Fehlermeldung
- [ ] **90-Min-Stabilität:** Lokaler Test mit Continuous-Mode über 90 Min ohne Crash (Workaround: Auto-Restart bei Recognition-End-Event ok)
- [ ] **Julia-Quickstart in README** verständlich (max 5 Schritte, kein Fachjargon)

**Soft-Requirements (nice-to-have, nicht blockierend):**

- [ ] Amakori-Styling (warm-grey/orange) — falls Zeit, sonst plain Tailwind defaults
- [ ] Mic-Indicator-Animation (Pulse) — statisch ok für MVP
- [ ] „Low Confidence"-Tooltip — Indicator-Farbe reicht für MVP

---

## Pre-Aufnahme-Akzeptanz-Test (Di 12.05.2026 abends)

Stephan + Julia gemeinsam, 30 Min, via Riverside-Test-Session:

1. Julia öffnet Vercel-URL in Chrome → grant Mic → „Start"
2. Stephan macht dasselbe auf seinem Laptop
3. **Test-Durchlauf 5 Min:**
   - Julia: Cold Open Mock-Phrase
   - Julia: „Hi zusammen, das ist Business ohne Bullshit, der Pod, von [Plattform]. Ich bin Julia Jung."
   - Stephan: „Und ich bin Stephan Baier."
   - Julia: 30 Sek Banter
   - Julia: „Wie auch immer. Drei Themen diese Woche."
   - Julia: News-Anchor zu Thema 1 (Time-Anchor + Editorial-Adjektiv + Stat-Drop)
   - Stephan: Macro-Reaktion mit 2 Stats
   - Julia: „Egal. Weiter im Programm." (Übergang zu Thema 2)
4. **Erwartetes Verhalten:**
   - Tool springt auf Element 1, 2 (×2), 3, 4, 5 (Thema 1), 6, 7 in der richtigen Reihenfolge
   - Latenz pro Sprung: <3 Sek nach Trigger-Phrase
   - Keine Rückwärts-Sprünge ohne Grund
5. **Bei Fail:** Tuning der Anchors in `f004.json`, redeploy, Re-Test.

**Akzeptanz:** ≥6 von 7 Sprüngen automatisch korrekt → GO für Aufnahme.

---

## Aufnahme-Tag (Mi 13.05.2026)

**Pre-Flight 30 Min vor Aufnahme:**
- [ ] Beide URLs offen, Mic-Permissions live
- [ ] Beide haben Kopfhörer auf (USB-Mic Setup-Reminder)
- [ ] Riverside-Session bereit
- [ ] F004-JSON ist die finale Version (Themen aus Sonntags-Sync eingearbeitet)
- [ ] Stephan hat lokalen Backup-Tab offen (falls Vercel down)

**Post-Aufnahme:**
- [ ] 5-Min-Debrief: Was hat geklappt, was nicht?
- [ ] Lessons Learned in `lessons-f004.md` festhalten
- [ ] Anchor-Tuning für F005 ableiten

---

*v1.0 · 2026-05-11*
