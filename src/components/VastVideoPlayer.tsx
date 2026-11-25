import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchVastAd,
  fireTrackingBeacons,
  getDefaultVastUrl,
  type VastAd,
  type VastTrackingEvent,
} from "@/lib/vast";

type Phase = "loading-ad" | "playing-ad" | "playing-content";

function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${String(rem).padStart(2, "0")}`;
}

export function VastVideoPlayer({
  src,
  poster,
  title,
  vastUrl,
}: {
  src: string;
  poster: string | undefined;
  title: string;
  vastUrl?: string | null | undefined;
}) {
  const resolvedVastUrl = vastUrl === undefined ? getDefaultVastUrl() : vastUrl;
  const [phase, setPhase] = useState<Phase>(() => (resolvedVastUrl ? "loading-ad" : "playing-content"));
  const [ad, setAd] = useState<VastAd | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!resolvedVastUrl) {
      setPhase("playing-content");
      return;
    }
    let active = true;
    const controller = new AbortController();
    firedRef.current.clear();
    setAd(null);
    setElapsed(0);
    setPhase("loading-ad");

    void fetchVastAd(resolvedVastUrl, { signal: controller.signal }).then((loaded) => {
      if (!active) return;
      if (loaded) {
        setAd(loaded);
        setPhase("playing-ad");
        fireTrackingBeacons(loaded.impressions);
      } else {
        setPhase("playing-content");
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [resolvedVastUrl, src]);

  useEffect(() => {
    if (phase !== "playing-ad" || !ad) return;
    const video = adVideoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          video.muted = true;
          setMuted(true);
          void video.play().catch(() => setPhase("playing-content"));
        });
      }
    }
    const timer = window.setInterval(() => {
      setElapsed((prev) => {
        const current = adVideoRef.current?.currentTime ?? 0;
        return current > prev ? current : prev + 0.5;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [phase, ad]);

  const trackOnce = (event: VastTrackingEvent) => {
    if (!ad || firedRef.current.has(event)) return;
    firedRef.current.add(event);
    fireTrackingBeacons(ad.tracking[event]);
  };

  const handleAdTimeUpdate = () => {
    const video = adVideoRef.current;
    if (!video || !ad) return;
    const current = video.currentTime;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : ad.durationSec;
    setElapsed(current);
    if (current > 0) trackOnce("start");
    if (duration > 0) {
      if (current >= duration * 0.25) trackOnce("firstQuartile");
      if (current >= duration * 0.5) trackOnce("midpoint");
      if (current >= duration * 0.75) trackOnce("thirdQuartile");
    }
  };

  const handleSkip = () => {
    trackOnce("skip");
    setPhase("playing-content");
  };

  const handleAdEnded = () => {
    trackOnce("complete");
    setPhase("playing-content");
  };

  if (phase === "loading-ad") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Loading video…</span>
      </div>
    );
  }

  if (phase === "playing-ad" && ad) {
    const remainingSkip = Math.max(0, Math.ceil(ad.skipOffsetSec - elapsed));
    const canSkip = remainingSkip <= 0;
    const totalDur =
      adVideoRef.current && Number.isFinite(adVideoRef.current.duration) && adVideoRef.current.duration > 0
        ? adVideoRef.current.duration
        : ad.durationSec;
    const remainingAd = Math.max(0, totalDur - elapsed);

    return (
      <div className="relative h-full w-full bg-background" role="region" aria-label="Advertisement">
        <video
          ref={adVideoRef}
          src={ad.mediaUrl}
          className="h-full w-full bg-background object-contain"
          autoPlay
          playsInline
          muted={muted}
          onTimeUpdate={handleAdTimeUpdate}
          onEnded={handleAdEnded}
          onError={() => setPhase("playing-content")}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-background/85 to-transparent p-3 sm:p-4">
          <span className="rounded-full bg-background/85 px-2.5 py-1 text-xs font-semibold text-foreground">
            Ad · {formatCountdown(remainingAd)}
          </span>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={muted ? "Unmute ad" : "Mute ad"}
            className="pointer-events-auto h-8 w-8 rounded-full"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (adVideoRef.current) adVideoRef.current.muted = next;
            }}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-background/90 to-transparent p-3 sm:p-4">
          {ad.clickThrough ? (
            <a
              href={ad.clickThrough}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => fireTrackingBeacons(ad.clickTracking)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-secondary/90 px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
            >
              Learn more
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="sm"
            variant={canSkip ? "default" : "secondary"}
            disabled={!canSkip}
            onClick={handleSkip}
            className="pointer-events-auto"
          >
            {canSkip ? (
              <>
                Skip Ad
                <SkipForward className="h-4 w-4" />
              </>
            ) : (
              `Skip in ${remainingSkip}s`
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <video
      key={src}
      className="h-full w-full bg-background object-contain"
      src={src}
      poster={poster}
      title={title}
      controls
      autoPlay
      playsInline
    />
  );
}