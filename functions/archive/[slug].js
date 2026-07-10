// GET /archive/:slug — one published dispatch or essay (light "letter" card on the storm-dark site).
// When an episode_url is set the page doubles as the episode's show-notes page
// (embed + transcript), so every YouTube description points one canonical URL here.

import { esc, fmtDate, shell } from "../_web.js";

// tolerate every common YouTube URL shape; null → not a YouTube link
function ytId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = (params.slug || "").toString();

  let a = null;
  if (env.DB) {
    a = await env.DB.prepare(
      `SELECT id, subject, preview, body_html, type, published_at, episode_url, transcript
       FROM articles WHERE slug = ?1 AND published_at IS NOT NULL`
    ).bind(slug).first();
  }

  // neighbors for prev/next navigation (published order; id breaks timestamp ties)
  let prev = null, next = null;
  if (a && env.DB) {
    [prev, next] = await Promise.all([
      env.DB.prepare(
        `SELECT subject, slug FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
         AND (published_at < ?1 OR (published_at = ?1 AND id < ?2))
         ORDER BY published_at DESC, id DESC LIMIT 1`
      ).bind(a.published_at, a.id).first(),
      env.DB.prepare(
        `SELECT subject, slug FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
         AND (published_at > ?1 OR (published_at = ?1 AND id > ?2))
         ORDER BY published_at ASC, id ASC LIMIT 1`
      ).bind(a.published_at, a.id).first(),
    ]);
  }

  if (!a) {
    const body = `<div class="wrap" style="min-height:60vh;display:grid;place-items:center;text-align:center;">
      <div><p class="eyebrow" style="justify-content:center;">Not found</p>
      <h1 style="font-size:clamp(30px,5vw,46px);">That piece isn't here.</h1>
      <p class="page-lede" style="margin:16px auto 0;">It may have moved. Here's everything else:</p>
      <p style="margin-top:26px;"><a class="btn btn-primary" href="/archive">← The archive</a></p></div></div>`;
    return new Response(shell({ title: "Not found — The Windstorm", description: "Page not found.", path: `/archive/${slug}`, body }),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const kind = a.type === "essay" ? "Essay" : "The Windstorm";
  const shareText = a.subject;
  const words = a.body_html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 220));

  // show notes: this page doubles as the episode's home when an episode exists
  const videoId = ytId(a.episode_url);
  const episode = videoId ? `
      <div class="episode-frame" style="position:relative;aspect-ratio:16/9;margin:0 auto 26px;border-radius:14px;overflow:hidden;border:1px solid var(--line-strong);background:#000;">
        <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${esc(a.subject)} — The Windstorm episode"
          style="position:absolute;inset:0;width:100%;height:100%;border:0;" loading="lazy" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>` :
    (a.episode_url ? `<p class="episode-frame" style="margin:0 auto 26px;"><a class="btn btn-primary" href="${esc(a.episode_url)}" target="_blank" rel="noopener">▶ Watch this episode ↗</a></p>` : "");
  const transcriptHtml = a.transcript ? `
      <details class="transcript" style="border:1px solid var(--line);border-radius:14px;padding:18px 22px;">
        <summary style="cursor:pointer;font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--bolt);">Episode transcript</summary>
        <div style="margin-top:16px;color:var(--soft);font-size:15.5px;line-height:1.75;">
          ${esc(a.transcript).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`).join("")}
        </div>
      </details>` : "";

  const body = `
  <article class="letter-wrap">
    <div class="wrap">
      <div class="letter-meta">
        <div class="lm-k">${kind}</div>
        <div class="lm-d">${fmtDate(a.published_at)} · ${readMin} min read${videoId || a.episode_url ? " · 🎙 episode" : ""}</div>
      </div>
      ${episode}
      <div class="letter">${a.body_html}</div>
      ${transcriptHtml}

      <div class="post-foot">
        <div class="share-row">
          <span class="sk">Share</span>
          <button class="share-btn" data-share="x">𝕏 / Twitter</button>
          <button class="share-btn" data-share="linkedin">LinkedIn</button>
          <button class="share-btn" data-share="facebook">Facebook</button>
          <button class="share-btn" data-share="copy" id="copyBtn">Copy link</button>
        </div>
        <div class="post-cta">
          <h3>Step into the eye</h3>
          <p>The Windstorm — one email a week from the calm center. Windy Word comes free with it.</p>
          <a class="btn btn-primary" href="/#join">Join free →</a>
        </div>
        ${prev || next ? `
        <nav class="post-neighbors" aria-label="More from the archive" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:26px;">
          ${prev ? `<a href="/archive/${esc(prev.slug)}" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px;">
            <span style="display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:6px;">← Earlier</span>
            <span style="color:var(--soft);font-size:14px;">${esc(prev.subject)}</span></a>` : `<span></span>`}
          ${next ? `<a href="/archive/${esc(next.slug)}" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-align:right;">
            <span style="display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:6px;">Later →</span>
            <span style="color:var(--soft);font-size:14px;">${esc(next.subject)}</span></a>` : `<span></span>`}
        </nav>` : ""}
        <div style="text-align:center;margin-top:26px;"><a class="back-link" href="/archive">← The archive</a></div>
      </div>
    </div>
  </article>
  <script>
  (function(){
    var url = location.href.split('#')[0].split('?')[0];
    var text = ${JSON.stringify(shareText)};
    var intents = {
      x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)
    };
    document.querySelectorAll('[data-share]').forEach(function(b){
      b.addEventListener('click', function(){
        var k = b.getAttribute('data-share');
        if (k === 'copy') {
          navigator.clipboard && navigator.clipboard.writeText(url).then(function(){ b.textContent = 'Copied ✓'; setTimeout(function(){ b.textContent = 'Copy link'; }, 1600); });
          return;
        }
        window.open(intents[k], '_blank', 'noopener,width=600,height=600');
      });
    });
  })();
  </script>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.subject,
    description: a.preview || undefined,
    datePublished: (a.published_at || "").replace(" ", "T") + "Z",
    url: `https://thewindstorm.ai/archive/${slug}`,
    image: "https://thewindstorm.ai/assets/og.jpg",
    wordCount: words,
    author: { "@type": "Person", name: "Grant Whitmer", url: "https://grantwhitmer.com/" },
    publisher: { "@type": "Organization", name: "The Windstorm", url: "https://thewindstorm.ai/" },
    mainEntityOfPage: `https://thewindstorm.ai/archive/${slug}`,
  };
  if (videoId) {
    jsonld.video = {
      "@type": "VideoObject",
      name: `${a.subject} — The Windstorm`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      uploadDate: (a.published_at || "").replace(" ", "T") + "Z",
      description: a.preview || a.subject,
    };
  }

  return new Response(
    shell({
      title: `${a.subject} — The Windstorm`,
      description: a.preview || `${kind} from the eye of the storm.`,
      path: `/archive/${esc(slug)}`,
      body,
      jsonld,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } }
  );
}
