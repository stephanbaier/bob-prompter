import Link from "next/link";
import { getAllEpisodes } from "@/lib/load-episode";

export default function Home() {
  const episodes = getAllEpisodes();
  const latest = episodes[0];
  const older = episodes.slice(1);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-stone-900">
        BoB Prompter
      </h1>
      <p className="mt-3 text-lg text-stone-600">
        Live-Teleprompter für <em>Business ohne Bullshit</em>.
      </p>

      {latest ? (
        <Link
          href={`/${latest.slug}`}
          className="mt-10 block rounded-2xl border-2 border-accent bg-accent/5 px-8 py-6 transition hover:bg-accent/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Aktuelle Folge
              </div>
              <div className="mt-3 font-display text-3xl text-stone-900">
                {latest.title}
              </div>
              <div className="mt-2 text-sm text-stone-500">
                Aufnahme: {latest.recordedAt}
              </div>
            </div>
            <div className="text-3xl text-accent">→</div>
          </div>
        </Link>
      ) : (
        <div className="mt-10 rounded-lg border border-stone-300 bg-stone-100 p-6 text-stone-600">
          Keine Folge in <code className="text-sm">data/</code> gefunden.
        </div>
      )}

      {older.length > 0 && (
        <>
          <h2 className="mt-12 text-xs font-semibold uppercase tracking-wider text-stone-500">
            Vergangene Folgen
          </h2>
          <ul className="mt-3 space-y-2">
            {older.map((ep) => (
              <li key={ep.slug}>
                <Link
                  href={`/${ep.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-stone-400"
                >
                  <div>
                    <div className="font-display text-lg text-stone-900">{ep.title}</div>
                    <div className="text-xs text-stone-500">Aufnahme: {ep.recordedAt}</div>
                  </div>
                  <span className="text-stone-400 opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-16 space-y-3 text-sm text-stone-600">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <strong>Browser-Hinweis:</strong> Chrome oder Edge nutzen (Web Speech API).
        </div>
        <p className="text-xs text-stone-500">
          Neue Folge: <code>data/f&lt;NNN&gt;.json</code> hinzufügen + push → Vercel deployed
          automatisch.
        </p>
      </div>
    </main>
  );
}
