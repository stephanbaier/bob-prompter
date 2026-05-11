"use client";

import type { Section } from "@/lib/types";

const LEAD_LABEL: Record<Section["lead"], string> = {
  julia: "Julia",
  stephan: "Stephan",
  both: "Beide",
};

const LEAD_BADGE: Record<Section["lead"], string> = {
  julia: "bg-pink-100 text-pink-900 border-pink-300",
  stephan: "bg-blue-100 text-blue-900 border-blue-300",
  both: "bg-stone-200 text-stone-800 border-stone-300",
};

type Props = {
  section: Section;
  index: number;
  prevTitle?: string | null;
  nextTitle?: string | null;
};

export default function ActiveCard({ section, index, prevTitle, nextTitle }: Props) {
  return (
    <article
      key={section.id}
      className="animate-card-enter mx-auto max-w-3xl rounded-2xl border-2 border-accent/40 bg-white p-6 shadow-lg ring-4 ring-accent/20 sm:p-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-stone-500">
            #{index + 1} · Element {section.element}
          </span>
          <span
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              LEAD_BADGE[section.lead],
            ].join(" ")}
          >
            {LEAD_LABEL[section.lead]}
          </span>
          {section.durationHint && (
            <span className="text-xs text-stone-500">{section.durationHint}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-accent">
          <span className="mic-pulse h-2 w-2 rounded-full bg-accent" />
          AKTIV
        </div>
      </header>

      <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-stone-900 md:text-4xl">
        {section.title}
      </h2>

      {(prevTitle || nextTitle) && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-stone-400">
          <span>
            <span className="text-stone-500">Vorher:</span>{" "}
            <span className="text-stone-600">{prevTitle ?? "—"}</span>
          </span>
          <span className="text-accent-dark">
            <span className="text-stone-500">Jetzt:</span> {section.title}
          </span>
          <span>
            <span className="text-stone-500">Danach:</span>{" "}
            <span className="text-stone-600">{nextTitle ?? "—"}</span>
          </span>
        </div>
      )}

      {/* Verbatim block — exact phrases for Greeting / Pivot-Line / Closer */}
      {section.verbatim && section.verbatim.length > 0 && (
        <div className="mt-5 space-y-2">
          {section.verbatim.map((line, i) => (
            <div
              key={i}
              className="rounded-lg bg-stone-900 px-5 py-3 font-mono text-base leading-relaxed text-stone-100"
            >
              <span className="mr-2 text-accent">
                {line.speaker === "julia" ? "Julia:" : "Stephan:"}
              </span>
              „{line.text}"
            </div>
          ))}
        </div>
      )}

      {/* Topic preview — Pivot-Line only */}
      {section.topicPreview && section.topicPreview.length > 0 && (
        <ol className="mt-5 space-y-2 rounded-lg border border-stone-200 bg-stone-50 px-5 py-4">
          {section.topicPreview.map((topic, i) => (
            <li key={i} className="flex gap-3 text-base text-stone-800">
              <span className="font-mono text-sm font-semibold text-accent-dark">{i + 1}.</span>
              <span>{topic}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Julia reads — conversational block */}
      {section.juliaScript && (
        <div className="mt-5 rounded-lg border-l-4 border-pink-400 bg-pink-50/60 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-700">
            Julia liest
          </div>
          <p className="mt-1 text-lg leading-relaxed text-stone-900">{section.juliaScript}</p>
        </div>
      )}

      {/* Optional separate handoff line */}
      {section.handoff && (
        <div className="mt-3 rounded-lg bg-pink-100 px-4 py-2 text-base text-stone-900">
          <span className="mr-1.5 font-semibold text-pink-800">→</span>
          {section.handoff}
        </div>
      )}

      {/* Stephan These */}
      {section.thesis && (
        <div className="mt-5 rounded-lg border-l-4 border-blue-400 bg-blue-50/60 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            Stephan — These
          </div>
          <p className="mt-1 text-lg font-medium leading-relaxed text-stone-900">{section.thesis}</p>
        </div>
      )}

      {/* Stats pills */}
      {section.stats && section.stats.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {section.stats.map((stat, i) => (
            <div key={i} className="flex flex-col rounded-xl bg-accent/10 px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500">
                {stat.label}
              </span>
              <span className="font-mono text-sm font-semibold text-stone-900">
                {stat.value}
              </span>
              {stat.source && <span className="text-[10px] text-stone-400">{stat.source}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Compact bullet list */}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-5 space-y-2">
          {section.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-3 text-base leading-snug text-stone-800">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Wins/Losses */}
      {section.winsLosses && section.winsLosses.length > 0 && (
        <div className="mt-5 space-y-2">
          {section.winsLosses.map((wl, i) => {
            const isJulia = wl.who === "julia";
            const isWin = wl.type === "sieger";
            return (
              <div
                key={i}
                className={[
                  "rounded-lg border-l-4 px-4 py-2",
                  isWin ? "border-emerald-400 bg-emerald-50/60" : "border-red-400 bg-red-50/60",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                  <span className={isJulia ? "text-pink-700" : "text-blue-700"}>{LEAD_LABEL[wl.who]}</span>
                  <span className={isWin ? "text-emerald-700" : "text-red-700"}>
                    {isWin ? "Sieger" : "Verlierer"}
                  </span>
                  <span className="text-stone-700">— {wl.pick}</span>
                </div>
                {wl.reason && <p className="mt-1 text-sm text-stone-700">{wl.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
