import { redirect } from "next/navigation";
import { getLatestEpisodeSlug } from "@/lib/load-episode";

export default function LatestPage() {
  const slug = getLatestEpisodeSlug();
  if (!slug) redirect("/");
  redirect(`/${slug}`);
}
