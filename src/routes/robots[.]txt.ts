import { createFileRoute } from "@tanstack/react-router";
import { buildRobotsTxt } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(buildRobotsTxt(origin), {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
