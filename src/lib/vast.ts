export type VastTrackingEvent =
  | "start"
  | "firstQuartile"
  | "midpoint"
  | "thirdQuartile"
  | "complete"
  | "skip";

export type VastAd = {
  title: string;
  mediaUrl: string;
  durationSec: number;
  skipOffsetSec: number;
  clickThrough: string | null;
  clickTracking: string[];
  impressions: string[];
  tracking: Record<VastTrackingEvent, string[]>;
};

const TRACKING_EVENTS: VastTrackingEvent[] = [
  "start",
  "firstQuartile",
  "midpoint",
  "thirdQuartile",
  "complete",
  "skip",
];

function emptyTracking(): Record<VastTrackingEvent, string[]> {
  return {
    start: [],
    firstQuartile: [],
    midpoint: [],
    thirdQuartile: [],
    complete: [],
    skip: [],
  };
}

export function parseVastTime(raw: string | null | undefined, durationSec = 0): number | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.endsWith("%")) {
    const pct = Number.parseFloat(value.slice(0, -1));
    if (!Number.isFinite(pct) || pct < 0 || durationSec <= 0) return null;
    return Math.round((durationSec * pct) / 100);
  }
  const parts = value.split(":").map((part) => Number.parseFloat(part));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const [h = 0, m = 0, s = 0] = parts;
  return Math.round(h * 3600 + m * 60 + s);
}

function textList(root: ParentNode, tagName: string): string[] {
  const out: string[] = [];
  for (const el of Array.from(root.querySelectorAll(tagName))) {
    const val = el.textContent?.trim();
    if (val) out.push(val);
  }
  return out;
}

function pickMediaFile(linear: Element): string | null {
  const files = Array.from(linear.querySelectorAll("MediaFile"))
    .map((el) => ({
      url: el.textContent?.trim() ?? "",
      type: (el.getAttribute("type") ?? "").toLowerCase(),
      width: Number.parseInt(el.getAttribute("width") ?? "0", 10) || 0,
      delivery: (el.getAttribute("delivery") ?? "progressive").toLowerCase(),
    }))
    .filter((f) => f.url && f.delivery !== "streaming");

  const mp4s = files.filter((f) => f.type.includes("mp4") || f.url.toLowerCase().includes(".mp4"));
  const pool = mp4s.length > 0 ? mp4s : files.filter((f) => f.type.includes("webm"));
  if (pool.length === 0) return null;

  pool.sort((a, b) => {
    const aFit = a.width > 0 && a.width <= 1280 ? 0 : 1;
    const bFit = b.width > 0 && b.width <= 1280 ? 0 : 1;
    if (aFit !== bFit) return aFit - bFit;
    return b.width - a.width;
  });
  return pool[0]?.url ?? null;
}

type ParsedVastResult =
  | { kind: "inline"; ad: VastAd }
  | {
      kind: "wrapper";
      tagUri: string;
      impressions: string[];
      clickTracking: string[];
      tracking: Record<VastTrackingEvent, string[]>;
    }
  | { kind: "empty" };

function collectTracking(root: ParentNode): Record<VastTrackingEvent, string[]> {
  const map = emptyTracking();
  for (const el of Array.from(root.querySelectorAll("Tracking"))) {
    const event = el.getAttribute("event") as VastTrackingEvent | null;
    const url = el.textContent?.trim();
    if (event && url && TRACKING_EVENTS.includes(event)) {
      map[event].push(url);
    }
  }
  return map;
}

export function parseVastXml(xml: string): ParsedVastResult {
  if (typeof DOMParser === "undefined") return { kind: "empty" };
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return { kind: "empty" };

  const wrapper = doc.querySelector("Wrapper");
  if (wrapper) {
    const tagUri = wrapper.querySelector("VASTAdTagURI")?.textContent?.trim();
    if (!tagUri) return { kind: "empty" };
    return {
      kind: "wrapper",
      tagUri,
      impressions: textList(wrapper, "Impression"),
      clickTracking: textList(wrapper, "ClickTracking"),
      tracking: collectTracking(wrapper),
    };
  }

  const inline = doc.querySelector("InLine");
  if (!inline) return { kind: "empty" };

  const linear = inline.querySelector("Linear");
  if (!linear) return { kind: "empty" };

  const mediaUrl = pickMediaFile(linear);
  if (!mediaUrl) return { kind: "empty" };

  const durationSec = parseVastTime(linear.querySelector("Duration")?.textContent) ?? 15;
  const parsedSkip = parseVastTime(linear.getAttribute("skipoffset"), durationSec);
  const skipOffsetSec = parsedSkip !== null ? Math.min(parsedSkip, durationSec) : Math.min(5, durationSec);

  return {
    kind: "inline",
    ad: {
      title: inline.querySelector("AdTitle")?.textContent?.trim() || "Sponsored Ad",
      mediaUrl,
      durationSec,
      skipOffsetSec,
      clickThrough: linear.querySelector("ClickThrough")?.textContent?.trim() || null,
      clickTracking: textList(linear, "ClickTracking"),
      impressions: textList(inline, "Impression"),
      tracking: collectTracking(linear),
    },
  };
}

export async function fetchVastAd(
  vastUrl: string,
  options?: { signal?: AbortSignal; timeoutMs?: number; maxRedirects?: number },
): Promise<VastAd | null> {
  const timeoutMs = options?.timeoutMs ?? 4000;
  const maxRedirects = options?.maxRedirects ?? 3;
  const extraImpressions: string[] = [];
  const extraClickTracking: string[] = [];
  const extraTracking = emptyTracking();
  let currentUrl = vastUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(currentUrl, { signal: controller.signal });
      if (!res.ok) return null;
      const xml = await res.text();
      const parsed = parseVastXml(xml);
      if (parsed.kind === "empty") return null;
      if (parsed.kind === "wrapper") {
        extraImpressions.push(...parsed.impressions);
        extraClickTracking.push(...parsed.clickTracking);
        for (const ev of TRACKING_EVENTS) extraTracking[ev].push(...parsed.tracking[ev]);
        currentUrl = parsed.tagUri;
        continue;
      }
      const ad = parsed.ad;
      ad.impressions = [...extraImpressions, ...ad.impressions];
      ad.clickTracking = [...extraClickTracking, ...ad.clickTracking];
      for (const ev of TRACKING_EVENTS) ad.tracking[ev] = [...extraTracking[ev], ...ad.tracking[ev]];
      return ad;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener("abort", onAbort);
    }
  }
  return null;
}

export function fireTrackingBeacons(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (!url || !/^https?:\/\//i.test(url)) continue;
    try {
      const img = new Image();
      img.src = url;
    } catch {
      // Ignore beacon errors so playback is never interrupted.
    }
  }
}

export function getDefaultVastUrl(): string {
  const configured = import.meta.env["VITE_VAST_TAG_URL"];
  return typeof configured === "string" && configured.trim().length > 0
    ? configured.trim()
    : "/sample-vast.xml";
}