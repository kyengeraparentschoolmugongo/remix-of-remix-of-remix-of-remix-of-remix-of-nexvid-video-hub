export const ADSENSE_PUBLISHER_ID = "ca-pub-8782637659456848";
export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;

export const ADSENSE_SLOTS = {
  primaryContent: "7993219163",
  catalogListing: "6708057658",
} as const;

export type AdSenseSlotKey = keyof typeof ADSENSE_SLOTS;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function isProductionAdDomain(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, "");
  if (!host) return false;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    host.endsWith(".test") ||
    host.endsWith(".example") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".webcontainer.io") ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--")
  ) {
    return false;
  }
  return host.includes(".");
}

export function resolveAdSenseSlot(slot: AdSenseSlotKey | string): string {
  if (slot in ADSENSE_SLOTS) {
    return ADSENSE_SLOTS[slot as AdSenseSlotKey];
  }
  return slot;
}

export function ensureAdSenseScript(hostname?: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const activeHost = hostname ?? window.location.hostname;
  if (!isProductionAdDomain(activeHost)) return false;

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src^="${ADSENSE_SCRIPT_URL}"]`,
  );
  if (existing) return true;

  const script = document.createElement("script");
  script.async = true;
  script.src = ADSENSE_SCRIPT_URL;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  return true;
}