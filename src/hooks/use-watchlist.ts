import { useCallback, useEffect, useState } from "react";
import type { MediaCardData } from "@/lib/tmdb.functions";

const KEY = "nexvid-watchlist";
const listeners = new Set<() => void>();
function read(): MediaCardData[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function useWatchlist() {
  const [items, setItems] = useState<MediaCardData[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);
  const has = useCallback((m: { id: number; kind: string }) => items.some((i) => i.id === m.id && i.kind === m.kind), [items]);
  const toggle = useCallback((m: MediaCardData) => {
    const cur = read();
    const exists = cur.some((i) => i.id === m.id && i.kind === m.kind);
    const next = exists ? cur.filter((i) => !(i.id === m.id && i.kind === m.kind)) : [m, ...cur];
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  }, []);
  return { items, has, toggle };
}
