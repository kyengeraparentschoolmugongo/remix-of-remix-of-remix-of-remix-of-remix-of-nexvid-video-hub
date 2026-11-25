import { createFileRoute, Link } from "@tanstack/react-router";
import { useWatchlist } from "@/hooks/use-watchlist";
import { MediaCard } from "@/components/MediaCard";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "My List — FRESHFLIX" },
      { name: "description", content: "The movies and series you saved to watch later." },
      { property: "og:title", content: "My List — FRESHFLIX" },
      { property: "og:description", content: "The movies and series you saved to watch later." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/watchlist" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/watchlist" }],
  }),
  component: Watchlist,
});

function Watchlist() {
  const { items } = useWatchlist();
  return (
    <div className="px-5 pb-20 pt-28 sm:px-10">
      <h1 className="font-display text-4xl text-foreground">My List</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nothing saved yet. <Link to="/" className="text-primary underline">Find something to watch</Link>.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] [&>a]:w-full">
          {items.map((m) => <MediaCard key={`${m.kind}-${m.id}`} m={m} />)}
        </div>
      )}
    </div>
  );
}
