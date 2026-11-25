import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { searchMedia } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";
import { AdSenseBanner } from "@/components/AdSenseBanner";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({
    meta: [
      { title: "Search movies & series — FRESHFLIX" },
      { name: "description", content: "Find any movie or TV show and watch its trailer." },
      { name: "robots", content: "noindex, follow" },
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

function SearchSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="w-full" aria-hidden="true">
          <div className="poster-frame img-shimmer aspect-[2/3]" />
          <div className="img-shimmer mt-2 h-4 w-3/4 rounded" />
        </div>
      ))}
    </>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);

  // Keep the box in sync when Back/Forward changes the address.
  useEffect(() => {
    setText(q);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== q) navigate({ search: { q: text }, replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  const query = q.trim();
  const { data = [], isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMedia({ data: { q: query } }),
    enabled: query.length > 0,
    staleTime: 300_000,
  });
  const typing = text.trim() !== query;
  const loading = text.trim().length > 0 && (isFetching || typing);

  return (
    <div className="px-5 pb-20 pt-28 sm:px-10">
      <h1 className="font-display text-4xl text-foreground">Search</h1>
      <label className="search-field mt-6">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Movies, series…"
          aria-label="Search movies and series"
          className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              navigate({ search: { q: "" }, replace: true });
            }}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </label>
      {query && !loading && data.length === 0 && (
        <p className="mt-10 text-muted-foreground">Nothing found for “{query}”.</p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] [&>a]:w-full">
        {loading && data.length === 0 ? <SearchSkeleton /> : data.map((m) => <MediaCard key={`${m.kind}-${m.id}`} m={m} />)}
      </div>
      {query.length > 0 && !loading && data.length > 0 && (
        <AdSenseBanner key={`search-ad-${query}`} slot="catalogListing" className="mx-auto max-w-6xl" />
      )}
    </div>
  );
}
