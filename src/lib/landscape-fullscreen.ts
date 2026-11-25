import { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_CLASS = "cinema-fallback-fullscreen";
const ROTATED_CLASS = "cinema-rotate-landscape";
const previousBodyOverflow = new WeakMap<HTMLElement, string>();

type FullscreenContainer = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export type NativeFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

type OrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};

function fullscreenDocument(): FullscreenDocument {
  return document as FullscreenDocument;
}

function fullscreenElement(): Element | null {
  return document.fullscreenElement ?? fullscreenDocument().webkitFullscreenElement ?? null;
}

export function isLandscapeFullscreenActive(
  container: HTMLElement,
  video?: NativeFullscreenVideo | null,
): boolean {
  return (
    fullscreenElement() === container ||
    container.classList.contains(FALLBACK_CLASS) ||
    Boolean(video?.webkitDisplayingFullscreen)
  );
}

async function lockLandscape(): Promise<void> {
  const orientation = screen.orientation as OrientationWithLock | undefined;
  if (!orientation?.lock) return;
  try {
    await orientation.lock("landscape");
  } catch {
    // Rotation lock is unavailable on some browsers; the CSS fallback still applies.
  }
}

function unlockOrientation(): void {
  try {
    (screen.orientation as OrientationWithLock | undefined)?.unlock?.();
  } catch {
    // Some browsers throw when no orientation lock is active.
  }
}

export function syncLandscapeRotation(container: HTMLElement): void {
  const active = fullscreenElement() === container || container.classList.contains(FALLBACK_CLASS);
  const isPhoneSized = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
  const shouldRotate = active && isPhoneSized && window.innerHeight > window.innerWidth;
  container.classList.toggle(ROTATED_CLASS, shouldRotate);
}

function enterFallback(container: HTMLElement): void {
  if (!previousBodyOverflow.has(container)) {
    previousBodyOverflow.set(container, document.body.style.overflow);
  }
  container.classList.add(FALLBACK_CLASS);
  document.body.style.overflow = "hidden";
  syncLandscapeRotation(container);
}

function leaveFallback(container: HTMLElement): void {
  if (!container.classList.contains(FALLBACK_CLASS)) return;
  container.classList.remove(FALLBACK_CLASS, ROTATED_CLASS);
  document.body.style.overflow = previousBodyOverflow.get(container) ?? "";
  previousBodyOverflow.delete(container);
}

export async function enterLandscapeFullscreen(
  container: HTMLElement,
  video?: NativeFullscreenVideo | null,
): Promise<void> {
  if (isLandscapeFullscreenActive(container, video)) return;

  const element = container as FullscreenContainer;
  const request = element.requestFullscreen ?? element.webkitRequestFullscreen;

  // iPhone Safari exposes native fullscreen on the video, not on arbitrary containers.
  if (!request && video?.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
    return;
  }

  if (request) {
    try {
      await request.call(element);
      await lockLandscape();
      syncLandscapeRotation(container);
      return;
    } catch {
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        return;
      }
    }
  }

  // YouTube iframes cannot use the video-element fallback, so use an in-page
  // fullscreen layer and rotate it when the browser refuses orientation lock.
  enterFallback(container);
}

export async function exitLandscapeFullscreen(
  container: HTMLElement,
  video?: NativeFullscreenVideo | null,
): Promise<void> {
  leaveFallback(container);

  if (video?.webkitDisplayingFullscreen && video.webkitExitFullscreen) {
    video.webkitExitFullscreen();
  }

  if (fullscreenElement() === container) {
    const doc = fullscreenDocument();
    const exit = document.exitFullscreen ?? doc.webkitExitFullscreen;
    if (exit) {
      try {
        await exit.call(document);
      } catch {
        // The browser may already have exited fullscreen.
      }
    }
  }

  container.classList.remove(ROTATED_CLASS);
  unlockOrientation();
}

export function useLandscapeFullscreen() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<NativeFullscreenVideo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sync = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setIsFullscreen(isLandscapeFullscreenActive(container, videoRef.current));
    syncLandscapeRotation(container);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && container?.classList.contains(FALLBACK_CLASS)) {
        void exitLandscapeFullscreen(container, video).then(sync);
      }
    };

    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("keydown", onEscape);
    video?.addEventListener("webkitbeginfullscreen", sync);
    video?.addEventListener("webkitendfullscreen", sync);

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("keydown", onEscape);
      video?.removeEventListener("webkitbeginfullscreen", sync);
      video?.removeEventListener("webkitendfullscreen", sync);
      if (container && isLandscapeFullscreenActive(container, video)) {
        void exitLandscapeFullscreen(container, video);
      }
    };
  }, [sync]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (isLandscapeFullscreenActive(container, videoRef.current)) {
      await exitLandscapeFullscreen(container, videoRef.current);
    } else {
      await enterLandscapeFullscreen(container, videoRef.current);
    }
    sync();
  }, [sync]);

  return { containerRef, videoRef, isFullscreen, toggleFullscreen };
}
