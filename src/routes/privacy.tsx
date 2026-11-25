import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FRESHFLIX" },
      {
        name: "description",
        content: "How FRESHFLIX handles visitor analytics, browser storage, embeds, and video ads.",
      },
      { property: "og:title", content: "Privacy Policy — FRESHFLIX" },
      {
        property: "og:description",
        content: "How FRESHFLIX handles visitor analytics, browser storage, embeds, and video ads.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-20 pt-28 text-foreground/85 sm:px-10">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: November 2026</p>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Visitor Analytics</h2>
        <p>
          We use Lovable&apos;s visitor analytics to understand how people use FRESHFLIX. It uses no
          cookies, stores nothing on your device, does not keep IP addresses, and does not identify
          visitors. Lovable collects this data for us.{" "}
          <a
            href="https://lovable.dev/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Lovable&apos;s privacy policy
          </a>{" "}
          explains how it handles it.
        </p>
        <p>
          On this site, Lovable&apos;s analytics records the pages visited, where visitors came
          from, their country, browser, operating system and device type, how long they stay, how
          fast pages load, errors, and clicks. Detailed data is kept for 90 days and daily summaries
          are kept for a year.
        </p>
        <p>
          Everything listed above is recorded for every visitor, without cookies and without
          identifying anyone.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Browser Storage (My List)</h2>
        <p>
          When you save titles to My List, FRESHFLIX stores that list locally in your browser using{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">localStorage</code> so your saved
          movies and series stay available on your device. This data remains on your browser and is
          not sent to our servers. You can clear it at any time through your browser settings.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Third-Party Services &amp; Embeds</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-foreground">The Movie Database (TMDB):</strong> Movie posters,
            backdrops, and cast photos are loaded from TMDB&apos;s image servers, which receive
            standard browser requests (including IP address and user agent) when images load.
          </li>
          <li>
            <strong className="text-foreground">YouTube Trailers:</strong> When you click Watch
            Trailer, an embedded YouTube player loads from Google&apos;s servers. YouTube may set
            cookies and collect usage data under Google&apos;s privacy policy.
          </li>
          <li>
            <strong className="text-foreground">Google AdSense:</strong> On live production domains,
            FRESHFLIX displays advertisements served by Google AdSense. Google and its partners may
            use cookies or similar technologies to serve ads based on your prior visits to this site
            or other websites. You can manage or opt out of personalized advertising through{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Ads Settings
            </a>
            .
          </li>
          <li>
            <strong className="text-foreground">Video Advertising (Future VAST Pre-Roll):</strong>{" "}
            When video pre-roll ads are enabled in the future, ad partners may receive your IP
            address, device info, and ad playback events (impressions, skips, and clicks) under their
            own privacy policies.
          </li>
          <li>
            <strong className="text-foreground">Google Fonts:</strong> Font files are fetched from
            Google Fonts to render site typography.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Contact</h2>
        <p>
          For privacy questions, contact{" "}
          <a href="mailto:privacy@freshflix.app" className="text-primary underline">
            privacy@freshflix.app
          </a>
          . See also our{" "}
          <Link to="/terms" className="text-primary underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/dmca" className="text-primary underline">
            DMCA Policy
          </Link>
          .
        </p>
      </section>
    </article>
  );
}