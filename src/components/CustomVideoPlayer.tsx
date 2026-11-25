import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandscapeFullscreen } from "@/lib/landscape-fullscreen";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remainder = whole % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function CustomVideoPlayer({
  src,
  poster,
  title,
  onError,
}: {
  src: string;
  poster: string | undefined;
  title: string;
  onError: () => void;
}) {
  const { containerRef, videoRef, isFullscreen, toggleFullscreen } = useLandscapeFullscreen();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2800);
    }
  }, [playing]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
    showControls();
  }, [showControls, videoRef]);

  const seekBy = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const end = Number.isFinite(video.duration) ? video.duration : Number.POSITIVE_INFINITY;
      video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), end);
      setCurrentTime(video.currentTime);
      showControls();
    },
    [showControls, videoRef],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  }, [videoRef]);

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input, select")) return;
    if (event.key === " " || event.key.toLowerCase() === "k") {
      event.preventDefault();
      togglePlayback();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekBy(-10);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      seekBy(10);
    } else if (event.key.toLowerCase() === "m") {
      toggleMute();
    } else if (event.key.toLowerCase() === "f") {
      void toggleFullscreen();
    }
  };

  const controlVisibility = controlsVisible
    ? "opacity-100"
    : "pointer-events-none opacity-0";

  return (
    <div
      ref={containerRef}
      className="cinema-frame group relative h-full w-full overflow-hidden bg-background outline-none"
      tabIndex={0}
      role="region"
      aria-label={`${title} video player`}
      onKeyDown={handleKeyboard}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        autoPlay
        playsInline
        preload="metadata"
        className="h-full w-full bg-background object-contain"
        onClick={togglePlayback}
        onDoubleClick={() => void toggleFullscreen()}
        onPlay={() => {
          setPlaying(true);
          setBuffering(false);
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(Number.isFinite(video.duration) ? video.duration : 0);
          setVolume(video.volume);
          setMuted(video.muted);
        }}
        onDurationChange={(event) => {
          setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setMuted(event.currentTarget.muted);
        }}
        onRateChange={(event) => setPlaybackRate(event.currentTarget.playbackRate)}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onError={onError}
      />

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background/85 to-transparent p-3 transition-opacity sm:p-4 ${controlVisibility}`}
      >
        <p className="truncate pr-2 text-xs font-semibold text-foreground sm:text-sm">{title}</p>
      </div>

      {buffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Buffering video" />
        </div>
      )}

      {!playing && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            type="button"
            size="icon"
            aria-label="Play video"
            onClick={togglePlayback}
            className="h-16 w-16 rounded-full shadow-lg [&_svg]:size-7"
          >
            <Play className="fill-current" />
          </Button>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent px-2 pb-2 pt-8 transition-opacity sm:px-4 sm:pb-3 ${controlVisibility}`}
      >
        <input
          type="range"
          aria-label="Seek video"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (videoRef.current) videoRef.current.currentTime = next;
            setCurrentTime(next);
          }}
          className="mb-2 h-1.5 w-full cursor-pointer accent-primary"
        />
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={playing ? "Pause video" : "Play video"}
              onClick={togglePlayback}
              className="h-8 w-8 text-foreground hover:bg-secondary/80 hover:text-foreground"
            >
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Rewind 10 seconds"
              title="Rewind 10 seconds"
              onClick={() => seekBy(-10)}
              className="relative h-8 w-8 text-foreground hover:bg-secondary/80 hover:text-foreground"
            >
              <RotateCcw />
              <span className="absolute text-[7px] font-bold">10</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds"
              onClick={() => seekBy(10)}
              className="relative h-8 w-8 text-foreground hover:bg-secondary/80 hover:text-foreground"
            >
              <RotateCw />
              <span className="absolute text-[7px] font-bold">10</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={muted ? "Unmute video" : "Mute video"}
              onClick={toggleMute}
              className="h-8 w-8 text-foreground hover:bg-secondary/80 hover:text-foreground"
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </Button>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (videoRef.current) {
                  videoRef.current.volume = next;
                  videoRef.current.muted = next === 0;
                }
                setVolume(next);
                setMuted(next === 0);
              }}
              className="hidden h-1.5 w-16 cursor-pointer accent-primary sm:block"
            />
            <span className="ml-1 whitespace-nowrap text-[10px] tabular-nums text-foreground/85 sm:text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <select
              aria-label="Playback speed"
              value={playbackRate}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (videoRef.current) videoRef.current.playbackRate = next;
                setPlaybackRate(next);
              }}
              className="h-8 rounded-md border border-border bg-background/80 px-1 text-[10px] font-medium text-foreground sm:px-2 sm:text-xs"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <option key={rate} value={rate}>
                  {rate}×
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen landscape"}
              onClick={() => void toggleFullscreen()}
              className="h-8 w-8 text-foreground hover:bg-secondary/80 hover:text-foreground"
            >
              {isFullscreen ? <Minimize /> : <Maximize />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
