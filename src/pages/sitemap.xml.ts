import type { APIRoute } from "astro";

/** Legacy sitemap URL retained from the Next.js site. */
export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-0.xml", site);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${sitemapURL.href}</loc></sitemap></sitemapindex>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
