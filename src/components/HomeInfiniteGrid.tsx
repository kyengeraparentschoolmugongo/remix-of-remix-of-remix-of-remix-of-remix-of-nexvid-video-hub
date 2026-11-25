import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getExplorePage, getVjMoviesPage, type MediaCardData } from "@/lib/tmdb.functions";
import { dedupeAppend } from "@/lib/media-browsing";
import type { VjSummary } from "@/lib/luganda-movies";
import { LandscapeCard } from "./LandscapeCard";

export function VjFilterBar({
  vjs,
  selected,
  onSelect,
}: {
  vjs: VjSummary[];
  selected: string | null;
  onSelect: (vj: string | null) => void;
}) {
  if (!vjs.length) return null;
  return (
    <section className="mt-8" aria-label="Browse by VJ">
      <h2 className="mb-3 px-4 font-display text-xl text-foreground sm:px-10">Browse by VJ</h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:px-10" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={selected === null}
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            selected === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          All categories
        </button>
        {vjs.map((vj) => {
          const active = selected === vj.name;
          return (
            <button
              key={vj.name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(active ? null : vj.name)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {vj.name}{" "}
              <span className={active ? "text-primary-foreground/80" : "text-muted-foreground"}>
                ({vj.count})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function useScrollSentinel(enabled: boolean, onReach: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onReach();
      },
      { rootMargin: "600px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, onReach]);
  return ref;
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="min-w-0">
          <div className="poster-frame img-shimmer aspect-video" />
          <div className="img-shimmer mt-2 h-4 w-3/4 rounded" />
        </div>
      ))}
    </>
  );
}

export function ExploreMoreGrid({
  displayed,
}: {
  displayed: Pick<MediaCardData, "id" | "kind">[];
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ["explore-more"],
    queryFn: ({ pageParam }) => getExplorePage({ data: { page: pageParam } }),
    initialPageParam: 2,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 600_000,
  });

  const items = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p.items) ?? [];
    return dedupeAppend(displayed, raw);
  }, [data, displayed]);

  useEffect(() => {
    if (!isPending && !isFetchingNextPage && hasNextPage && items.length < 8) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isPending, items.length]);

  const sentinelRef = useScrollSentinel(Boolean(hasNextPage) && !isFetchingNextPage, () => {
    void fetchNextPage();
  });

  return (
    <section className="mt-10 px-4 sm:px-10" aria-label="More movies to explore">
      <h2 className="mb-4 font-display text-xl text-foreground">More to explore</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <LandscapeCard key={`${m.kind}-${m.id}`} m={m} grid />
        ))}
        {(isPending || isFetchingNextPage) && <GridSkeleton count={4} />}
      </div>
      <div ref={sentinelRef} className="h-10" aria-hidden="true" />
    </section>
  );
}

export function VjMoviesGrid({ vj, count }: { vj: string; count: number }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ["vj-movies", vj],
    queryFn: ({ pageParam }) => getVjMoviesPage({ data: { vj, offset: pageParam, limit: 12 } }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    staleTime: 600_000,
  });

  const items = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p.items) ?? [];
    return dedupeAppend([], raw);
  }, [data]);

  const sentinelRef = useScrollSentinel(Boolean(hasNextPage) && !isFetchingNextPage, () => {
    void fetchNextPage();
  });

  return (
    <section className="mt-8 px-4 sm:px-10" aria-label={`${vj} movies`}>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-foreground">{vj}</h2>
        <span className="text-xs text-muted-foreground">{count} translated movies</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <LandscapeCard key={`${m.kind}-${m.id}`} m={m} grid />
        ))}
        {(isPending || isFetchingNextPage) && <GridSkeleton count={8} />}
      </div>
      <div ref={sentinelRef} className="h-10" aria-hidden="true" />
    </section>
  );
}