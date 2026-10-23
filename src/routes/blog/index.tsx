import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { listPublishedPosts } from "@/lib/showbizz/content";
import { documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/blog/")({
  loader: () => listPublishedPosts(),
  head: () =>
    documentHead({
      title: "Journal",
      description: metaDescription(
        "Notes published by Showbizz Cars. Drafts stay off this page.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/blog",
    }),
  component: JournalPage,
});

function JournalPage() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-display text-4xl">Journal</h1>
        <p className="mt-4 text-muted">Posts appear here after the team marks them published.</p>
        {data.posts.length === 0 ? (
          <p className="mt-8 text-muted">No posts are published yet.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {data.posts.map((post) => (
              <li key={post.slug} className="border-t border-line pt-6">
                <h2 className="font-display text-2xl">
                  <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                {post.publishedOn ? (
                  <p className="mt-2 text-sm tabular-nums text-muted">{post.publishedOn}</p>
                ) : null}
                {post.excerpt ? <p className="mt-3 text-muted">{post.excerpt}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
