// GET /feed.xml — RSS 2.0 feed of all published dispatches + essays

const escXml = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

function rfc822(s) {
  const d = new Date(String(s).replace(" ", "T") + "Z");
  return isNaN(d) ? new Date().toUTCString() : d.toUTCString();
}

export async function onRequestGet(context) {
  const { env } = context;
  let rows = { results: [] };
  if (env.DB) {
    rows = await env.DB.prepare(
      `SELECT subject, preview, slug, type, published_at FROM articles
       WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC LIMIT 50`
    ).all();
  }

  const items = rows.results.map((a) => `    <item>
      <title>${escXml(a.subject)}</title>
      <link>https://thewindstorm.ai/archive/${escXml(a.slug)}</link>
      <guid isPermaLink="true">https://thewindstorm.ai/archive/${escXml(a.slug)}</guid>
      <pubDate>${rfc822(a.published_at)}</pubDate>
      <category>${a.type === "essay" ? "Essay" : "Dispatch"}</category>
      ${a.preview ? `<description>${escXml(a.preview)}</description>` : ""}
    </item>`).join("\n");

  const lastBuild = rows.results.length ? rfc822(rows.results[0].published_at) : new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Windstorm</title>
    <link>https://thewindstorm.ai/archive</link>
    <atom:link href="https://thewindstorm.ai/feed.xml" rel="self" type="application/rss+xml" />
    <description>The weekly dispatch from the eye of the AI storm — what actually happened, what it means, and one thing worth doing about it. By Grant Whitmer.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });
}
