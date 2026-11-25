import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getDetail } from "@/lib/tmdb.functions";
import { DetailPage } from "@/components/DetailPage";
import { homeQuery } from "@/lib/home-query";
import { findLugandaStreams, groupStreamsByVj, selectVjGroup } from "@/lib/luganda-movies";

const movieSearchSchema = z.object({
  vj: z.string().optional(),
});

const q = (id: string) =>
  queryOptions({
    queryKey: ["movie", id],
    queryFn: () => getDetail({ data: { kind: "movie", id: Number(id) } }),
  });

export const Route = createFileRoute("/movie/$id")({
  validateSearch: movieSearchSchema,
  loaderDeps: ({ search }) => ({ vj: search.vj }),
  loader: async ({ context, params, deps }) => {
    const [detail] = await Promise.all([
      context.queryClient.ensureQueryData(q(params.id)),
      context.queryClient.ensureQueryData(homeQuery),
    ]);
    const groups = groupStreamsByVj(findLugandaStreams(detail.title, detail.year));
    const activeGroup = selectVjGroup(groups, deps.vj);
    return { detail, activeGroup, requestedVj: deps.vj };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — FRESHFLIX" }, { name: "robots", content: "noindex" }],
      };
    }
    const { detail, activeGroup, requestedVj } = loaderData;
    const namedVj = activeGroup && activeGroup.vj !== "Luganda Translated" ? activeGroup.vj : null;
    const t = namedVj
      ? `${detail.title} (Luganda Translated by ${namedVj}) — Watch Online | FRESHFLIX`
      : activeGroup
        ? `${detail.title} (Luganda Translated) — Watch Online | FRESHFLIX`
        : `${detail.title} — FRESHFLIX`;
    const rawDesc = namedVj
      ? `Watch ${detail.title} Luganda translated by ${namedVj} on FRESHFLIX. ${detail.overview}`
      : activeGroup
        ? `Watch ${detail.title} Luganda translated on FRESHFLIX. ${detail.overview}`
        : detail.overview || "Details, cast and trailer on FRESHFLIX.";
    const desc = rawDesc.trim().slice(0, 155);
    const pageUrl =
      requestedVj && activeGroup
        ? `/movie/${params.id}?vj=${encodeURIComponent(activeGroup.slug)}`
        : `/movie/${params.id}`;
    const meta = [
      { title: t },
      { name: "description", content: desc },
      { property: "og:title", content: t },
      { property: "og:description", content: desc },
      { property: "og:type", content: "video.movie" },
      { property: "og:url", content: pageUrl },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (detail.backdrop)
      meta.push(
        { property: "og:image", content: detail.backdrop },
        { name: "twitter:image", content: detail.backdrop },
      );

    const movieSchema: Record<string, unknown> = {
      "@type": "Movie",
      name: detail.title,
      description: detail.overview || desc,
      ...(detail.year ? { datePublished: detail.year } : {}),
      ...(detail.backdrop ?? detail.poster ? { image: detail.backdrop ?? detail.poster } : {}),
      ...(detail.genres.length > 0 ? { genre: detail.genres } : {}),
      ...(detail.rating > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: detail.rating,
              bestRating: 10,
              worstRating: 1,
              ratingCount: 1,
            },
          }
        : {}),
      ...(activeGroup ? { inLanguage: "lg" } : {}),
      ...(namedVj ? { translator: { "@type": "Person", name: namedVj } } : {}),
    };

    const graph: Record<string, unknown>[] = [movieSchema];
    const primaryStream = activeGroup?.streams[0];
    if (activeGroup && primaryStream) {
      graph.push({
        "@type": "VideoObject",
        name: namedVj ? `${detail.title} (Luganda Translated by ${namedVj})` : `${detail.title} (Luganda Translated)`,
        description: desc,
        inLanguage: "lg",
        ...(detail.backdrop ?? detail.poster ? { thumbnailUrl: detail.backdrop ?? detail.poster } : {}),
        ...(detail.year ? { uploadDate: `${detail.year}-01-01` } : {}),
        contentUrl: primaryStream.href,
      });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
        },
      ],
    };
  },
  component: Page,
  errorComponent: () => (
    <div className="p-24 text-center text-muted-foreground">
      It's not yet available. Try again later.
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-24 text-center text-muted-foreground">
      It's not yet available. Try again later.
    </div>
  ),
});

function Page() {
  const { id } = Route.useParams();
  const { vj } = Route.useSearch();
  const { data } = useSuspenseQuery(q(id));
  const { data: home } = useSuspenseQuery(homeQuery);
  return <DetailPage d={data} rows={home.rows} requestedVj={vj} />;
}
