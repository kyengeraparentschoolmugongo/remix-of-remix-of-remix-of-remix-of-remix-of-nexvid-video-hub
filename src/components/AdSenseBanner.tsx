import { useEffect, useRef, useState } from "react";
import {
  ADSENSE_PUBLISHER_ID,
  ensureAdSenseScript,
  isProductionAdDomain,
  resolveAdSenseSlot,
  type AdSenseSlotKey,
} from "@/lib/adsense";

export function AdSenseBanner({
  slot,
  className,
  hostname,
}: {
  slot: AdSenseSlotKey | string;
  className?: string | undefined;
  hostname?: string | undefined;
}) {
  const slotId = resolveAdSenseSlot(slot);
  const [activeHost, setActiveHost] = useState<string | null>(null);
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    setActiveHost(hostname ?? window.location.hostname);
  }, [hostname]);

  const isLive = activeHost !== null && isProductionAdDomain(activeHost);

  useEffect(() => {
    if (!isLive || !activeHost) return;
    const insEl = insRef.current;
    if (!insEl) return;
    if (
      pushedRef.current ||
      insEl.dataset["adsensePushed"] === "true" ||
      insEl.getAttribute("data-adsbygoogle-status") !== null
    ) {
      return;
    }

    ensureAdSenseScript(activeHost);
    pushedRef.current = true;
    insEl.dataset["adsensePushed"] = "true";

    try {
      const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
      adsbygoogle.push({});
    } catch {
      // Ignore push errors when ad requests are blocked or throttled
    }
  }, [isLive, activeHost, slotId]);

  return (
    <aside
      aria-label="Advertisement"
      className={`my-8 w-full ${className ?? ""}`}
    >
      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Advertisement
      </p>
      <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-card/40 sm:min-h-[250px]">
        {isLive ? (
          <ins
            ref={insRef}
            className="adsbygoogle block w-full"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_PUBLISHER_ID}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Ad space reserved (Slot {slotId}) — live ads load on production domains only.
          </p>
        )}
      </div>
    </aside>
  );
}