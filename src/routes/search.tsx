import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { searchMedia } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";
import { AdSenseBanner } from "@/components/AdSenseBanner";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({
    meta: [
      { title: "Search movies & series — FRESHFLIX" },
      { name: "description", content: "Find any movie or TV show and watch its trailer." },
      { property: "og:title", content: "Search movies & series — FRESHFLIX" },
      { property: "og:description", content: "Find any movie or TV show and watch its trailer." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/search" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => { if (text !== q) navigate({ search: { q: text }, replace: true }); }, 350);
    return () => clearTimeout(t);
  }, [text, q, navigate]);
  const { data = [], isFetching } = useQuery({ queryKey: ["search", q], queryFn: () => searchMedia({ data: { q } }), enabled: q.trim().length > 0 });
  return (
    <div className="px-5 pb-20 pt-28 sm:px-10">
      <h1 className="font-display text-4xl text-foreground">Search</h1>
      <label className="search-field mt-6">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Movies, series…" className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground" />
      </label>
      {q && !isFetching && data.length === 0 && <p className="mt-10 text-muted-foreground">Nothing found for “{q}”.</p>}
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] [&>a]:w-full">
        {data.map((m) => <MediaCard key={`${m.kind}-${m.id}`} m={m} />)}
      </div>
      {q.trim().length > 0 && data.length > 0 && (
        <AdSenseBanner key={`search-ad-${q}`} slot="catalogListing" className="mx-auto max-w-6xl" />
      )}
    </div>
  );
}
