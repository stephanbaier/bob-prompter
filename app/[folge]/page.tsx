import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllEpisodes, loadEpisode } from "@/lib/load-episode";
import Prompter from "@/components/Prompter";

type Params = { folge: string };

export default async function FolgePage({ params }: { params: Params }) {
  const allowedSlugs = getAllEpisodes().map((e) => e.slug);
  if (!allowedSlugs.includes(params.folge.toLowerCase())) {
    notFound();
  }
  const episode = await loadEpisode(params.folge);
  if (!episode) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900"
        >
          ← Folgen-Übersicht
        </Link>
      </div>
      <Prompter episode={episode} />
    </div>
  );
}
