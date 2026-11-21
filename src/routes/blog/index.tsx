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
        "Stories, notes and perspectives published by Showbizz Cars. Drafts stay private.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/blog",
    }),
  component: JournalPage,
});

function JournalPage() {
  const data = Route.useLoaderData();
  const [featuredPost, ...otherPosts] = data.posts;

  return (
    <SiteShell settings={data.settings}>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_15%,rgba(200,205,209,.14),transparent_38%),linear-gradient(120deg,#111416,#08090a_65%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_.8fr] md:items-end md:py-24">
          <div>
            <p className="eyebrow">Showbizz Cars / Journal</p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[.95] sm:text-6xl md:text-7xl">
              In motion. <em>In perspective.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Notes on premium mobility, vehicle subscriptions and the details that shape a more considered driving experience.
            </p>
          </div>
          <div className="relative min-h-52 overflow-hidden rounded-card border border-white/10 bg-[radial-gradient(ellipse_at_76%_30%,rgba(215,220,224,.27),transparent_23%),linear-gradient(145deg,#2a2e32,#111416_56%,#050606)] p-6 sm:min-h-64 sm:p-8">
            <div className="absolute inset-x-6 top-1/2 h-px bg-white/15" />
            <div className="absolute inset-x-6 top-[calc(50%+12px)] h-px bg-white/10" />
            <div className="relative flex h-full min-h-40 flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-[.22em] text-white/55">The Showbizz point of view</span>
              <span className="max-w-xs font-display text-3xl leading-tight text-white/90 sm:text-4xl">A closer look at the road ahead.</span>
              <span className="text-xs uppercase tracking-[.18em] text-white/45">Ideas / Ownership / Mobility</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow">01 / Latest stories</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">The Journal</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">Articles appear here when the Showbizz Cars team publishes them.</p>
        </div>

        {data.posts.length === 0 ? (
          <div className="mt-8 rounded-card border border-line bg-surface p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted">Editorial desk</p>
            <h3 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl">Good stories start with a point of view.</h3>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              The journal is being prepared. New articles will appear here after they are written and published from the admin panel.
            </p>
          </div>
        ) : (
          <>
            {featuredPost ? (
              <article className="mt-8 grid overflow-hidden rounded-card border border-line bg-surface md:grid-cols-[.8fr_1.2fr]">
                <div className="flex min-h-56 flex-col justify-between bg-[radial-gradient(ellipse_at_75%_25%,rgba(200,205,209,.2),transparent_25%),linear-gradient(145deg,#33383d,#0b0d0e)] p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/60">Featured story</p>
                  <span className="font-display text-5xl text-white/80">01</span>
                </div>
                <div className="p-6 sm:p-10">
                  {featuredPost.publishedOn ? <p className="text-xs uppercase tracking-[.16em] text-muted">{featuredPost.publishedOn}</p> : null}
                  <h3 className="mt-3 font-display text-3xl sm:text-4xl">
                    <Link to="/blog/$slug" params={{ slug: featuredPost.slug }} className="hover:text-[#c9ccca]">
                      {featuredPost.title}
                    </Link>
                  </h3>
                  {featuredPost.excerpt ? <p className="mt-4 max-w-2xl leading-7 text-muted">{featuredPost.excerpt}</p> : null}
                  <Link to="/blog/$slug" params={{ slug: featuredPost.slug }} className="mt-7 inline-flex min-h-11 items-center border-b border-line text-sm font-semibold">
                    Read story <span className="ml-2" aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ) : null}

            {otherPosts.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {otherPosts.map((post, index) => (
                  <article key={post.slug} className="rounded-card border border-line bg-surface p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[.18em] text-muted">Story / {String(index + 2).padStart(2, "0")}</span>
                      {post.publishedOn ? <span className="text-xs tabular-nums text-muted">{post.publishedOn}</span> : null}
                    </div>
                    <h3 className="mt-5 font-display text-2xl sm:text-3xl">
                      <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-[#c9ccca]">{post.title}</Link>
                    </h3>
                    {post.excerpt ? <p className="mt-3 leading-7 text-muted">{post.excerpt}</p> : null}
                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="mt-6 inline-flex items-center text-sm font-semibold">
                      Read story <span className="ml-2" aria-hidden="true">↗</span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </SiteShell>
  );
}
