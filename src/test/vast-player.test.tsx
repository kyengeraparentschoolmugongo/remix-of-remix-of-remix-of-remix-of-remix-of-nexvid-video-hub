import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseVastTime, parseVastXml } from "@/lib/vast";
import { VastVideoPlayer } from "@/components/VastVideoPlayer";

const SAMPLE_VAST = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="3.0">
  <Ad id="1">
    <InLine>
      <AdTitle>Test Sponsor</AdTitle>
      <Impression>https://ads.example.com/imp</Impression>
      <Creatives>
        <Creative>
          <Linear skipoffset="00:00:05">
            <Duration>00:00:10</Duration>
            <VideoClicks>
              <ClickThrough>https://advertiser.example.com</ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="640" height="360">
                https://cdn.example.com/ad.mp4
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VAST XML parsing and pre-roll player", () => {
  it("parses inline VAST XML duration, skip offset, media file, and clickthrough", () => {
    const parsed = parseVastXml(SAMPLE_VAST);
    expect(parsed.kind).toBe("inline");
    if (parsed.kind !== "inline") return;
    expect(parsed.ad.mediaUrl).toBe("https://cdn.example.com/ad.mp4");
    expect(parsed.ad.durationSec).toBe(10);
    expect(parsed.ad.skipOffsetSec).toBe(5);
    expect(parsed.ad.clickThrough).toBe("https://advertiser.example.com");
    expect(parseVastTime("25%", 20)).toBe(5);
  });

  it("plays a pre-roll ad with a 5-second skip countdown and transitions to the movie on skip", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(SAMPLE_VAST, { status: 200 }));

    render(
      <VastVideoPlayer
        src="https://cdn.example.com/movie.mp4"
        poster={undefined}
        title="Evil Dead Rise (VJ Emmy)"
        vastUrl="https://ads.example.com/vast.xml"
      />,
    );

    const skipBtn = await screen.findByRole("button", { name: /Skip in 5s/i });
    expect(skipBtn).toBeDisabled();

    const adVideo = document.querySelector("video") as HTMLVideoElement;
    expect(adVideo).toHaveAttribute("src", "https://cdn.example.com/ad.mp4");
    Object.defineProperty(adVideo, "currentTime", { value: 5, configurable: true });
    fireEvent.timeUpdate(adVideo);

    const readySkip = await screen.findByRole("button", { name: /Skip Ad/i });
    expect(readySkip).toBeEnabled();

    await userEvent.click(readySkip);

    await waitFor(() => {
      expect(screen.getByTitle("Evil Dead Rise (VJ Emmy)")).toHaveAttribute(
        "src",
        "https://cdn.example.com/movie.mp4",
      );
    });
  });

  it("falls back directly to the movie if the VAST request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network blocked"));

    render(
      <VastVideoPlayer
        src="https://cdn.example.com/movie.mp4"
        poster={undefined}
        title="Evil Dead Rise (VJ Emmy)"
        vastUrl="https://ads.example.com/vast.xml"
      />,
    );

    expect(await screen.findByTitle("Evil Dead Rise (VJ Emmy)")).toHaveAttribute(
      "src",
      "https://cdn.example.com/movie.mp4",
    );
  });
});