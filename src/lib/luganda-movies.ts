import rawMovies from "@/data/luganda-movies.json";

export type LugandaMovie = {
  title: string;
  year: number;
  vj: string;
  href: string;
};

export type VjSummary = {
  name: string;
  count: number;
};

export type VjStreamGroup = {
  vj: string;
  slug: string;
  streams: LugandaMovie[];
};

const movies = rawMovies as LugandaMovie[];

const BY_VJ_SUFFIX =
  /\s+by\s+(?:vj\s+)?(?:ice\s*p|junior|emmy|kevo|muba|jingo|kevin|mark|lance|ulio)\b.*$/i;
const PART_SUFFIX = /\s+part\s*(\d+)\s*$/i;

export function cleanLugandaTitle(title: string): string {
  return title.replace(BY_VJ_SUFFIX, "").replace(PART_SUFFIX, "").trim();
}

export function normalizeMovieTitle(title: string): string {
  return cleanLugandaTitle(title)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function entryWithPartLabel(entry: LugandaMovie): LugandaMovie {
  const partMatch = entry.title.match(PART_SUFFIX);
  if (!partMatch?.[1]) return entry;
  return { ...entry, vj: `${entry.vj} · Part ${partMatch[1]}` };
}

const indexByTitle = new Map<string, LugandaMovie[]>();
const entriesWithKey: { key: string; entry: LugandaMovie }[] = [];
for (const entry of movies) {
  const key = normalizeMovieTitle(entry.title);
  if (!key) continue;
  const list = indexByTitle.get(key);
  if (list) list.push(entry);
  else indexByTitle.set(key, [entry]);
  entriesWithKey.push({ key, entry });
}

function dedupeStreams(list: LugandaMovie[]): LugandaMovie[] {
  const seen = new Set<string>();
  const out: LugandaMovie[] = [];
  for (const item of list) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(entryWithPartLabel(item));
  }
  return out;
}

export function findLugandaStreams(
  title: string,
  year?: string | number | null,
): LugandaMovie[] {
  const norm = normalizeMovieTitle(title);
  if (!norm) return [];
  const parsedYear = typeof year === "number" ? year : Number.parseInt(year ?? "", 10);
  const candidates = indexByTitle.get(norm);

  if (candidates && candidates.length > 0) {
    if (!Number.isFinite(parsedYear)) return dedupeStreams(candidates);
    const exact = candidates.filter((m) => m.year === parsedYear);
    if (exact.length > 0) return dedupeStreams(exact);
    const near = candidates.filter((m) => Math.abs(m.year - parsedYear) <= 1);
    if (near.length > 0) return dedupeStreams(near);
    return [];
  }

  if (!Number.isFinite(parsedYear)) return [];
  const prefixMatches = entriesWithKey
    .filter(
      ({ key, entry }) =>
        key.length >= 6 &&
        Math.abs(entry.year - parsedYear) <= 1 &&
        (norm.startsWith(`${key} `) || key.startsWith(`${norm} `)),
    )
    .map(({ entry }) => entry);
  return dedupeStreams(prefixMatches);
}

export function stripPartSuffix(vj: string): string {
  return vj.replace(/\s*·\s*Part\s*\d+$/i, "").trim();
}

export function slugifyVj(vj: string): string {
  return stripPartSuffix(vj)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function groupStreamsByVj(streams: LugandaMovie[]): VjStreamGroup[] {
  const bySlug = new Map<string, VjStreamGroup>();
  for (const stream of streams) {
    const vj = stripPartSuffix(stream.vj) || "Luganda Translated";
    const slug = slugifyVj(vj) || "luganda-translated";
    const existing = bySlug.get(slug);
    if (existing) {
      existing.streams.push(stream);
    } else {
      bySlug.set(slug, { vj, slug, streams: [stream] });
    }
  }
  return [...bySlug.values()];
}

export function selectVjGroup(
  groups: VjStreamGroup[],
  requestedVj?: string | null,
): VjStreamGroup | null {
  if (groups.length === 0) return null;
  const wanted = requestedVj?.trim();
  if (!wanted) return groups[0] ?? null;
  const wantedLower = wanted.toLowerCase();
  const wantedSlug = slugifyVj(wanted);
  return (
    groups.find((g) => g.slug === wantedSlug || g.vj.toLowerCase() === wantedLower) ??
    groups[0] ??
    null
  );
}

export function getLugandaBadgeLabel(
  title: string,
  year?: string | number | null,
  preferredVj?: string,
): string | null {
  const rawVj = preferredVj ?? findLugandaStreams(title, year)[0]?.vj;
  if (!rawVj) return null;
  const vj = stripPartSuffix(rawVj);
  if (!vj || vj === "Luganda Translated") return "Luganda Translated";
  return `Luganda Translated · ${vj}`;
}

export function catalogKey(entry: Pick<LugandaMovie, "title" | "year">): string {
  return `${normalizeMovieTitle(entry.title)}-${entry.year}`;
}

function uniqueSorted(list: LugandaMovie[], excludeKeys?: Set<string>): LugandaMovie[] {
  const sorted = [...list].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const seen = new Set<string>(excludeKeys);
  const out: LugandaMovie[] = [];
  for (const item of sorted) {
    const key = catalogKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function listVjs(): VjSummary[] {
  const byVj = new Map<string, Set<string>>();
  for (const entry of movies) {
    if (!entry.vj || entry.vj === "Luganda Translated") continue;
    const key = catalogKey(entry);
    let set = byVj.get(entry.vj);
    if (!set) {
      set = new Set();
      byVj.set(entry.vj, set);
    }
    set.add(key);
  }
  return [...byVj.entries()]
    .filter(([, keys]) => keys.size >= 2)
    .map(([name, keys]) => ({ name, count: keys.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getFeaturedLugandaCatalog(limit: number): LugandaMovie[] {
  const queues = listVjs()
    .slice(0, 6)
    .map((v) => uniqueSorted(movies.filter((m) => m.vj === v.name)));
  const seen = new Set<string>();
  const out: LugandaMovie[] = [];
  let round = 0;
  while (out.length < limit) {
    let added = false;
    for (const q of queues) {
      while (round < q.length) {
        const item = q[round];
        if (!item) break;
        const key = catalogKey(item);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(item);
          added = true;
          break;
        }
        q.splice(round, 1);
      }
      if (out.length >= limit) break;
    }
    if (!added) break;
    round += 1;
  }
  return out;
}

export function getVjCatalog(
  vj: string,
  offset: number,
  limit: number,
  excludeKeys?: Set<string>,
): { items: LugandaMovie[]; hasMore: boolean; total: number } {
  const filtered = vj === "all" ? movies : movies.filter((m) => m.vj === vj);
  const unique = uniqueSorted(filtered, excludeKeys);
  const items = unique.slice(offset, offset + limit);
  return { items, hasMore: offset + limit < unique.length, total: unique.length };
}