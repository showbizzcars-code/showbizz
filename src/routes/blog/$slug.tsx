import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getPublishedPost } from "@/lib/showbizz/content";
import { blogPostingJsonLd, documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const data = await getPublishedPost({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Journal" }] };
    const { post, origin } = loaderData;
    return documentHead({
      title: post.metaTitle || post.title,
      description: metaDescription(post.metaDescription || post.excerpt, DEFAULT_DESCRIPTION),
      path: `/blog/${post.slug}`,
      jsonLd: blogPostingJsonLd(post, origin ? `${origin}/blog/${post.slug}` : null),
    });
  },
  notFoundComponent: PostMissing,
  component: PostPage,
});

function PostPage() {
  const { post, settings } = Route.useLoaderData();
  return (
    <SiteShell settings={settings}>
      <article className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm">
          <Link to="/blog" className="underline">
            Journal
          </Link>
        </p>
        <h1 className="mt-4 font-display text-4xl">{post.title}</h1>
        {post.publishedOn ? (
          <p className="mt-3 text-sm tabular-nums text-muted">{post.publishedOn}</p>
        ) : null}
        {post.excerpt ? <p className="mt-6 text-lg text-muted">{post.excerpt}</p> : null}
        {post.body ? (
          <div className="mt-8 whitespace-pre-wrap">{post.body}</div>
        ) : (
          <p className="mt-8 text-muted">This post has no body yet.</p>
        )}
      </article>
    </SiteShell>
  );
}

function PostMissing() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-display text-4xl">This post is not published</h1>
        <p className="mt-4">
          <Link to="/blog" className="underline">
            Back to the journal
          </Link>
        </p>
      </section>
    </SiteShell>
  );
}
