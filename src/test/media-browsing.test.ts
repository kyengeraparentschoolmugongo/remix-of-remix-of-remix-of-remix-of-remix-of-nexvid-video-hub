import { describe, expect, it } from "vitest";
import { dedupeAppend, detailRows, featuredSlides, uniqueRows } from "@/lib/media-browsing";
import { getFeaturedLugandaCatalog, getLugandaBadgeLabel, getVjCatalog, listVjs } from "@/lib/luganda-movies";
import type { MediaCardData } from "@/lib/tmdb.functions";

const movie = (id: number, kind: "movie" | "tv" = "movie"): MediaCardData => ({
  id,
  kind,
  title: `Title ${id}`,
  poster: null,
  backdrop: null,
  year: "2026",
  rating: 7,
  overview: "",
});

describe("Browsing variety", () => {
  it("shows each movie only once across homepage categories, excluding the featured movie", () => {
    const rows = uniqueRows(
      [
        { title: "Trending", items: [movie(1), movie(2), movie(2)] },
        { title: "Popular", items: [movie(1), movie(2), movie(3)] },
        { title: "Action", items: [movie(2), movie(3), movie(4)] },
      ],
      [movie(1)],
    );
    expect(rows.map((r) => r.items.map((m) => m.id))).toEqual([[2], [3], [4]]);
  });
  it("keeps a movie and series with the same numeric ID", () => {
    expect(
      uniqueRows([{ title: "Trending", items: [movie(1), movie(1, "tv")] }])[0]?.items,
    ).toHaveLength(2);
  });
  it("adds the three agreed categories below recommendations without repeating the current movie or another recommendation", () => {
    const rows = detailRows({ ...movie(1), similar: [movie(1), movie(2)] }, [
      { title: "Luganda Translated", items: [movie(2), movie(6)] },
      { title: "Trending now", items: [movie(2), movie(3)] },
      { title: "Top rated films", items: [movie(3), movie(4)] },
      { title: "Popular series", items: [movie(5, "tv")] },
    ]);
    expect(rows.map((r) => r.title)).toEqual([
      "More like this",
      "More Luganda Translated",
      "Trending this week",
      "Top rated films",
      "Popular series",
    ]);
    expect(rows.flatMap((r) => r.items.map((m) => `${m.kind}-${m.id}`))).toEqual([
      "movie-2",
      "movie-6",
      "movie-3",
      "movie-4",
      "tv-5",
    ]);
  });
  it("features the first seven trending titles with backdrops", () => {
    const items = Array.from({ length: 9 }, (_, index) => ({
      ...movie(index + 1),
      backdrop: `/${index + 1}.jpg`,
    }));
    expect(featuredSlides([{ title: "Trending now", items }]).map((item) => item.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });
  it("skips featured duplicates and titles without backdrops", () => {
    const featured = { ...movie(1), backdrop: "/1.jpg" };
    const rows = [
      {
        title: "Trending now",
        items: [movie(99), featured, featured, { ...movie(2), backdrop: "/2.jpg" }],
      },
    ];
    expect(featuredSlides(rows).map((item) => item.id)).toEqual([1, 2]);
  });
  it("allows both movies and series in the featured carousel", () => {
    const rows = [
      {
        title: "Trending now",
        items: [
          { ...movie(1), backdrop: "/movie.jpg" },
          { ...movie(1, "tv"), backdrop: "/tv.jpg" },
        ],
      },
    ];
    expect(featuredSlides(rows).map((item) => item.kind)).toEqual(["movie", "tv"]);
  });
  it("never repeats already-displayed movies when appending infinite scroll batches", () => {
    const alreadyShown = [movie(1), movie(2), movie(3, "tv")];
    const incoming = [movie(2), movie(4), movie(4), movie(3), movie(3, "tv"), movie(5)];
    expect(dedupeAppend(alreadyShown, incoming).map((m) => `${m.kind}-${m.id}`)).toEqual([
      "movie-4",
      "movie-3",
      "movie-5",
    ]);
  });
});

describe("Luganda catalog badges and VJ categories", () => {
  it("formats Luganda Translated badge with VJ name when known and plain Luganda Translated when generic", () => {
    expect(getLugandaBadgeLabel("Dr. Dolittle 2", "2001")).toBe("Luganda Translated · VJ Emmy");
    expect(getLugandaBadgeLabel("Sample Untranslated Movie", "2026")).toBeNull();
    expect(getLugandaBadgeLabel("Unknown Film", "2026", "Luganda Translated")).toBe("Luganda Translated");
    expect(getLugandaBadgeLabel("Evil Dead Rise", "2023", "VJ Emmy")).toBe("Luganda Translated · VJ Emmy");
  });
  it("lists named VJs sorted by movie count and filters strictly by VJ", () => {
    const vjs = listVjs();
    expect(vjs[0]?.name).toBe("VJ Junior");
    expect(vjs[0]?.count ?? 0).toBeGreaterThan(500);
    const emmy = getVjCatalog("VJ Emmy", 0, 10);
    expect(emmy.items).toHaveLength(10);
    expect(emmy.items.every((m) => m.vj === "VJ Emmy")).toBe(true);
    expect(emmy.hasMore).toBe(true);
  });
  it("interleaves multiple VJs in the featured Luganda Translated shelf", () => {
    const featured = getFeaturedLugandaCatalog(12);
    const distinctVjs = new Set(featured.map((m) => m.vj));
    expect(featured).toHaveLength(12);
    expect(distinctVjs.size).toBeGreaterThanOrEqual(4);
  });
});
