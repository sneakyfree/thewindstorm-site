// Shared server-rendered shell for thewindstorm.ai's archive pages (not a route — underscore).

export const esc = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(String(s).replace(" ", "T") + "Z");
  return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function shell({ title, description, path, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#07070C" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="https://thewindstorm.ai${esc(path)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://thewindstorm.ai${esc(path)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="https://thewindstorm.ai/assets/og.jpg" />
<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://thewindstorm.ai/assets/og.jpg" />
<link rel="icon" href="/assets/favicon.png" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="alternate" type="application/rss+xml" title="The Windstorm" href="/feed.xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css?v=20260711a" />
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<header class="nav scrolled">
  <div class="wrap nav-inner">
    <a class="brand" href="/"><img src="/assets/eye-360.webp" alt="" width="34" height="34" /><span>The <b>Windstorm</b></span></a>
    <nav class="nav-links">
      <a href="/archive">Archive</a>
      <a href="https://www.youtube.com/@TheWindstormAI" target="_blank" rel="noopener">YouTube</a>
      <a href="/#join" class="nav-cta">Join free</a>
    </nav>
  </div>
</header>
<main>${body}</main>
<footer class="foot">
  <div class="wrap foot-inner">
    <div class="foot-brand">
      <img src="/assets/eye-360.webp" alt="" width="40" height="40" />
      <div>
        <span>© <span id="year">2026</span> The Windstorm · conducted by <a href="https://grantwhitmer.com" target="_blank" rel="noopener">Grant Whitmer</a></span><br/>
        <span class="quiet">Spoken into existence. Built by voice.</span>
      </div>
    </div>
    <div class="foot-links">
      <a href="/archive">Archive</a>
      <a href="/feed.xml">RSS</a>
      <a href="https://www.youtube.com/@TheWindstormAI" target="_blank" rel="noopener">YouTube</a>
      <a href="https://windyword.ai" target="_blank" rel="noopener">Windy Word</a>
    </div>
  </div>
</footer>
<script>document.getElementById("year").textContent = new Date().getFullYear();</script>
</body>
</html>`;
}
