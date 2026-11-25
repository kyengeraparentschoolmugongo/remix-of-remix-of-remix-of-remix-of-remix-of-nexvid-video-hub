import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FRESHFLIX" },
      {
        name: "description",
        content: "Terms and conditions governing use of FRESHFLIX.",
      },
      { property: "og:title", content: "Terms of Service — FRESHFLIX" },
      {
        property: "og:description",
        content: "Terms and conditions governing use of FRESHFLIX.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-20 pt-28 text-foreground/85 sm:px-10">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: November 2026</p>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing or using FRESHFLIX, you agree to be bound by these Terms of Service. If you
          do not agree, please discontinue use of the site.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">2. Service Description</h2>
        <p>
          FRESHFLIX is a movie and television discovery platform featuring film details, cast
          information, trailers, and Luganda-translated movie playback links. Availability of
          specific titles or streams may change at any time without notice.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">3. Acceptable Use</h2>
        <p>
          You agree to use FRESHFLIX for personal, non-commercial viewing only. You may not attempt
          to disrupt the service, scrape content automatically, bypass video advertisements or
          technical protections, or redistribute site content unlawfully.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">4. Third-Party Links &amp; Ads</h2>
        <p>
          FRESHFLIX displays third-party trailers, video links, and advertisements. We are not
          responsible for the content, availability, or practices of third-party websites or
          advertisers.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">5. Disclaimer</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. We may update
          these terms from time to time; continued use after updates means you accept the revised
          terms.
        </p>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Read our{" "}
        <Link to="/privacy" className="text-primary underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/dmca" className="text-primary underline">
          DMCA Policy
        </Link>
        .
      </p>
    </article>
  );
}