import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enterLandscapeFullscreen,
  exitLandscapeFullscreen,
  type NativeFullscreenVideo,
} from "@/lib/landscape-fullscreen";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
}

describe("landscape fullscreen", () => {
  beforeEach(() => {
    setViewport(390, 844);
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("requests fullscreen and locks mobile orientation to landscape", async () => {
    const container = document.createElement("div");
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const lock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(container, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(screen, "orientation", { configurable: true, value: { lock } });

    await enterLandscapeFullscreen(container);

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("uses native video fullscreen when iPhone Safari has no container fullscreen", async () => {
    const container = document.createElement("div");
    const video = document.createElement("video") as NativeFullscreenVideo;
    const webkitEnterFullscreen = vi.fn();
    video.webkitEnterFullscreen = webkitEnterFullscreen;

    await enterLandscapeFullscreen(container, video);

    expect(webkitEnterFullscreen).toHaveBeenCalledOnce();
    expect(container.classList.contains("cinema-fallback-fullscreen")).toBe(false);
  });

  it("rotates an in-page fallback in portrait and cleans it up on exit", async () => {
    const container = document.createElement("div");
    const unlock = vi.fn();
    Object.defineProperty(screen, "orientation", { configurable: true, value: { unlock } });

    await enterLandscapeFullscreen(container);
    expect(container).toHaveClass("cinema-fallback-fullscreen", "cinema-rotate-landscape");
    expect(document.body.style.overflow).toBe("hidden");

    await exitLandscapeFullscreen(container);
    expect(container).not.toHaveClass("cinema-fallback-fullscreen", "cinema-rotate-landscape");
    expect(document.body.style.overflow).toBe("");
    expect(unlock).toHaveBeenCalledOnce();
  });
});
