import type { MediaCardData } from "./tmdb.functions";

export type MediaRow = { title: string; items: MediaCardData[] };

export function featuredSlides(rows: MediaRow[], limit = 7): MediaCardData[] {
  const trending = rows.find((row) => row.title === "Trending now")?.items ?? [];
  const seen = new Set<string>();
  return trending
    .filter((item) => {
      const key = `${item.kind}-${item.id}`;
      if (!item.backdrop || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function uniqueRows(
  rows: MediaRow[],
  excluded: Pick<MediaCardData, "id" | "kind">[] = [],
  limit = 20,
): MediaRow[] {
  const seen = new Set(excluded.map((m) => `${m.kind}-${m.id}`));
  return rows
    .map((row) => {
      const items: MediaCardData[] = [];
      for (const m of row.items) {
        const key = `${m.kind}-${m.id}`;
        if (seen.has(key) || items.length >= limit) continue;
        seen.add(key);
        items.push(m);
      }
      return { title: row.title, items };
    })
    .filter((row) => row.items.length > 0);
}

export function detailRows(detail: MediaCardData & { similar: MediaCardData[] }, rows: MediaRow[]) {
  const shelves = [
    { title: "More Luganda Translated", source: "Luganda Translated" },
    { title: "Trending this week", source: "Trending now" },
    { title: "Top rated films", source: "Top rated films" },
    { title: "Popular series", source: "Popular series" },
  ];
  return uniqueRows(
    [
      { title: "More like this", items: detail.similar },
      ...shelves.map(({ title, source }) => ({
        title,
        items: rows.find((r) => r.title === source)?.items ?? [],
      })),
    ],
    [detail],
    12,
  );
}

export function dedupeAppend(
  existing: Pick<MediaCardData, "id" | "kind">[],
  incoming: MediaCardData[],
): MediaCardData[] {
  const seen = new Set(existing.map((m) => `${m.kind}-${m.id}`));
  const added: MediaCardData[] = [];
  for (const item of incoming) {
    const key = `${item.kind}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(item);
  }
  return added;
}
