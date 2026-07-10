// GET /archive — every published dispatch + essay

import { esc, fmtDate, shell } from "../_web.js";

export async function onRequestGet(context) {
  const { env } = context;
  let rows = { results: [] };
  if (env.DB) {
    rows = await env.DB.prepare(
      `SELECT subject, preview, slug, type, published_at, episode_url
       FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC, id DESC`
    ).all();
  }

  const items = rows.results.map((a) => `
    <a class="post-item" href="/archive/${esc(a.slug)}">
      <div class="pi-meta">${a.type === "essay" ? "Essay" : "Dispatch"} · ${fmtDate(a.published_at)}${a.episode_url ? " · 🎙 watch the episode" : ""}</div>
      <h2>${esc(a.subject)}</h2>
      ${a.preview ? `<p>${esc(a.preview)}</p>` : ""}
      <span class="pi-more">Read →</span>
    </a>`).join("");

  const body = `
  <div class="wrap">
    <div class="page-head">
      <p class="eyebrow">The archive</p>
      <h1>Every dispatch from the eye.</h1>
      <p class="page-lede">The weekly Windstorm — what actually happened, what it meant, and what was worth doing about it — plus the occasional longer essay. Read them all; the storm keeps its records.</p>
    </div>
    <div class="post-list">
      ${items || `<p class="empty-note">The first dispatch is forming. <a href="/#join">Join free</a> and it lands in your inbox the moment it breaks.</p>`}
    </div>
    <div style="padding:10px 0 80px;">
      <a class="btn btn-primary" href="/#join">Step into the eye — join free →</a>
    </div>
  </div>`;

  return new Response(
    shell({
      title: "Archive — The Windstorm",
      description: "Every issue of The Windstorm — the weekly dispatch from the eye of the AI storm — plus essays on conducting intelligence.",
      path: "/archive",
      body,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } }
  );
}
