import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "DMCA & Copyright Policy — FRESHFLIX" },
      {
        name: "description",
        content: "Copyright and DMCA takedown notice procedure for FRESHFLIX.",
      },
      { property: "og:title", content: "DMCA & Copyright Policy — FRESHFLIX" },
      {
        property: "og:description",
        content: "Copyright and DMCA takedown notice procedure for FRESHFLIX.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/dmca" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/dmca" }],
  }),
  component: DmcaPage,
});

function DmcaPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-20 pt-28 text-foreground/85 sm:px-10">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">
        DMCA &amp; Copyright Policy
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: November 2026</p>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Respect for Intellectual Property</h2>
        <p>
          FRESHFLIX respects the intellectual property rights of content creators, studios, and
          distributors. Film and television descriptions, ratings, cast listings, and artwork are
          sourced from The Movie Database (TMDB), and trailers are embedded directly from YouTube.
        </p>
        <p>
          We do not knowingly host or upload infringing media files on our servers. Any external
          translated video links referenced in our catalog are linked for discovery and are promptly
          removed upon receipt of a valid copyright notice.
        </p>
      </section>

      <section className="mt-8 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl text-foreground">Submitting a Takedown Notice</h2>
        <p>
          If you are a copyright owner or authorized agent and believe that a title or link on
          FRESHFLIX infringes your copyright, please send a written DMCA notice including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>The exact FRESHFLIX page URL(s) containing the material you want removed.</li>
          <li>Your full name, organization (if applicable), and a valid contact email address.</li>
          <li>
            A good-faith statement that the disputed use is not authorized by the copyright owner,
            its agent, or the law.
          </li>
          <li>
            A statement that the information in your notice is accurate and that you are authorized
            to act on behalf of the rights holder.
          </li>
        </ul>
        <p>
          Send takedown notices to{" "}
          <a href="mailto:dmca@freshflix.app" className="text-primary underline">
            dmca@freshflix.app
          </a>
          . Valid requests are reviewed and removed within 48 hours.
        </p>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        See also our{" "}
        <Link to="/terms" className="text-primary underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-primary underline">
          Privacy Policy
        </Link>
        .
      </p>
    </article>
  );
}