import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DetailPage } from "@/components/DetailPage";
import { LandscapeCard } from "@/components/LandscapeCard";
import { MediaCard } from "@/components/MediaCard";
import type { MediaDetail } from "@/lib/tmdb.functions";
import { findLugandaStreams } from "@/lib/luganda-movies";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    params,
    search,
  }: {
    children: ReactNode;
    className?: string;
    to?: string;
    params?: Record<string, string>;
    search?: Record<string, string | undefined>;
  }) => {
    let href = to ?? "#";
    if (params) {
      for (const [k, v] of Object.entries(params)) href = href.replace(`$${k}`, v);
    }
    if (search?.["vj"]) href = `${href}?vj=${encodeURIComponent(search["vj"])}`;
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

const detail = (over: Partial<MediaDetail> = {}): MediaDetail => ({
  id: 1,
  kind: "movie",
  title: "Sample Film",
  poster: null,
  backdrop: null,
  year: "2026",
  rating: 7,
  overview: "An overview.",
  genres: [],
  runtime: "120 min",
  tagline: "",
  trailerKey: null,
  cast: [],
  similar: [],
  ...over,
});

describe("Unavailable playback", () => {
  it("says the title is not yet available when Play Movie is clicked", async () => {
    render(<DetailPage d={detail()} rows={[]} />);

    await userEvent.click(screen.getByRole("button", { name: /play movie/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Movie not yet available");
  });

  it("says the trailer is not yet available when no trailer exists", async () => {
    render(<DetailPage d={detail()} rows={[]} />);

    await userEvent.click(screen.getByRole("button", { name: /watch trailer/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trailer not yet available");
  });

  it("plays the trailer when one exists", async () => {
    render(<DetailPage d={detail({ trailerKey: "abc123" })} rows={[]} />);

    await userEvent.click(screen.getByRole("button", { name: /watch trailer/i }));

    expect(screen.getByTitle("Sample Film trailer")).toHaveAttribute(
      "src",
      expect.stringContaining("youtube.com/embed/abc123"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Luganda movie playback", () => {
  it("matches a Luganda translated movie by title and year and streams the mp4", async () => {
    render(<DetailPage d={detail({ title: "Dr. Dolittle 2", year: "2001" })} rows={[]} />);

    expect(screen.getAllByText("Luganda Translated · VJ Emmy").length).toBeGreaterThanOrEqual(2);

    await userEvent.click(screen.getByRole("button", { name: /play movie/i }));

    const video = screen.getByTitle("Dr. Dolittle 2 (VJ Emmy)");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("src", expect.stringContaining(".mp4"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not mismatch a remake from a different decade", () => {
    expect(findLugandaStreams("Dr. Dolittle 2", "2024")).toHaveLength(0);
  });

  it("routes alternate VJ cuts through the Same movie by other VJs shelf and honors requestedVj", async () => {
    const { rerender } = render(
      <DetailPage d={detail({ id: 713704, title: "Evil Dead Rise", year: "2023" })} rows={[]} />,
    );

    expect(screen.getByRole("heading", { name: "Same movie by other VJs" })).toBeInTheDocument();
    const otherLink = screen.getByRole("link", { name: /Luganda Translated · VJ Emmy/i });
    expect(otherLink).toHaveAttribute("href", "/movie/713704?vj=vj-emmy");

    await userEvent.click(screen.getByRole("button", { name: /play movie/i }));
    expect(screen.getByTitle("Evil Dead Rise (VJ Junior)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "VJ Emmy" })).not.toBeInTheDocument();

    rerender(
      <DetailPage
        d={detail({ id: 713704, title: "Evil Dead Rise", year: "2023" })}
        rows={[]}
        requestedVj="vj-emmy"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /play movie/i }));
    expect(screen.getByTitle("Evil Dead Rise (VJ Emmy)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luganda Translated · VJ Junior/i })).toHaveAttribute(
      "href",
      "/movie/713704?vj=vj-junior",
    );
  });

  it("matches subtitle-extended and multi-part Luganda titles cleanly", () => {
    expect(findLugandaStreams("Puss in Boots: The Last Wish", "2022")[0]?.vj).toBe("VJ Kevo");
    const gotg = findLugandaStreams("Guardians of the Galaxy Vol. 3", "2023");
    expect(gotg.map((s) => s.vj)).toEqual(["VJ Junior · Part 1", "VJ Junior · Part 2"]);
  });

  it("shows the Luganda Translated label below the title on translated cards and omits it on untranslated cards", () => {
    const { rerender } = render(
      <LandscapeCard m={detail({ title: "Dr. Dolittle 2", year: "2001" })} />,
    );
    const label = screen.getByText("Luganda Translated · VJ Emmy");
    expect(label).toBeInTheDocument();
    expect(label.closest(".poster-frame")).toBeNull();

    rerender(<LandscapeCard m={detail({ title: "Upcoming Cinema Release", year: "2026" })} />);
    expect(screen.queryByText(/Luganda Translated/i)).not.toBeInTheDocument();
  });

  it("shows the Luganda Translated label below the title on vertical poster cards", () => {
    render(<MediaCard m={detail({ title: "Dr. Dolittle 2", year: "2001" })} />);
    const label = screen.getByText("Luganda Translated · VJ Emmy");
    expect(label).toBeInTheDocument();
    expect(label.closest(".poster-frame")).toBeNull();
  });
});
