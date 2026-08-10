import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://swapspace.lovable.app";
const routes = ["/", "/how-it-works", "/market", "/categories", "/auth"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((r) => `  <url><loc>${SITE}${r}</loc><changefreq>daily</changefreq></url>`)
  .join("\n")}
</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
