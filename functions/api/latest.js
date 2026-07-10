// GET /api/latest — the most recent published piece, for the homepage card

export async function onRequestGet(context) {
  const { env } = context;
  let post = null;
  if (env.DB) {
    post = await env.DB.prepare(
      `SELECT subject, preview, slug, type, published_at, episode_url
       FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC, id DESC LIMIT 1`
    ).first();
  }
  return new Response(JSON.stringify({ ok: true, post }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
