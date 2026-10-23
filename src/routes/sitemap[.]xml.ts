import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapXml } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { sitemapEntries } = await import("@/lib/showbizz/content");
          const origin = new URL(request.url).origin;
          const xml = buildSitemapXml(origin, await sitemapEntries());
          return new Response(xml, {
            headers: { "content-type": "application/xml; charset=utf-8" },
          });
        } catch (error) {
          const { logError } = await import("@/lib/showbizz/log.server");
          logError("sitemap.failed", { message: error instanceof Error ? error.message : "unknown" });
          return new Response("Sitemap unavailable", { status: 500 });
        }
      },
    },
  },
});
