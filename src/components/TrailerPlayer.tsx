import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandscapeFullscreen } from "@/lib/landscape-fullscreen";

export function TrailerPlayer({ trailerKey, title }: { trailerKey: string; title: string }) {
  const { containerRef, isFullscreen, toggleFullscreen } = useLandscapeFullscreen();

  return (
    <div ref={containerRef} className="cinema-frame relative h-full w-full overflow-hidden bg-background">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&playsinline=1&rel=0`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={isFullscreen ? "Exit trailer fullscreen" : "Enter trailer fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen landscape"}
        onClick={() => void toggleFullscreen()}
        className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-background/80 text-foreground shadow-md hover:bg-secondary"
      >
        {isFullscreen ? <Minimize /> : <Maximize />}
      </Button>
    </div>
  );
}
