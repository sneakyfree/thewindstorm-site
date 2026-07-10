// POST /api/subscribe — join The Windstorm (Resend audience + welcome email)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function wantsJSON(request) {
  return (request.headers.get("accept") || "").includes("application/json");
}

function respond(request, ok, message, status) {
  if (wantsJSON(request)) {
    return new Response(JSON.stringify({ ok, message }), {
      status: status || (ok ? 200 : 400),
      headers: { "Content-Type": "application/json" },
    });
  }
  // no-JS fallback: land on the thanks page (or bounce home on error)
  const to = ok ? "/thanks?s=brief" : "/?error=subscribe#windstorm";
  return Response.redirect(new URL(to, request.url), 303);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let form;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, "Bad request.", 400);
  }

  // honeypot: bots fill it, humans never see it
  if ((form.get("company_website") || "").toString().trim() !== "") {
    return respond(request, true, "You're in — welcome aboard.");
  }

  const email = (form.get("email") || "").toString().trim().toLowerCase().slice(0, 254);
  if (!EMAIL_RE.test(email)) {
    return respond(request, false, "That email doesn't look right — give it another try.");
  }

  const source = (form.get("source") || "newsletter").toString().slice(0, 40);
  // Cloudflare stamps the visitor's country on every request — free geo, no form field
  const country = (request.headers.get("cf-ipcountry") || "").slice(0, 2).toUpperCase() || null;

  // D1 is the source of truth — record the member first (best-effort; a DB
  // hiccup must not cost us the signup, so we log and press on to Resend).
  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO members (email, source, country, status)
         VALUES (?1, ?2, ?3, 'active')
         ON CONFLICT(email) DO UPDATE SET status = 'active', updated_at = datetime('now')`
      ).bind(email, source, country).run();
    } catch (e) {
      console.log("D1 member upsert failed", email, String(e));
    }
  }

  const auth = {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    // Resend signals an existing contact with a 4xx; treat "already exists" as success
    if (!/exist/i.test(body)) {
      console.log("subscribe failed", res.status, body);
      // 400, not 502 — Cloudflare replaces 52x responses with its own error page
      return respond(request, false, "Something hiccuped on our end — try again in a minute.", 400);
    }
    return respond(request, true, "You're already on the list — welcome back.");
  }

  // capture the Resend contact id back onto the member row (best-effort)
  if (env.DB) {
    context.waitUntil(
      res.json().then((body) => {
        const cid = body && body.id;
        if (cid) {
          return env.DB.prepare(`UPDATE members SET resend_contact_id = ?1 WHERE email = ?2`)
            .bind(cid, email).run();
        }
      }).catch(() => {})
    );
  }

  // best-effort welcome note; a failure here shouldn't fail the signup
  context.waitUntil(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [email],
        reply_to: env.INQUIRY_TO,
        subject: "Welcome to The Windstorm",
        html: [
          "<div style='font-family:Georgia,serif;font-size:17px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:8px 4px;'>",
          "<p>Welcome aboard.</p>",
          "<p>You're inside <b>The Windstorm</b> — one email a week from the eye of the storm: what actually happened as AI wove itself a little deeper into human life, what it means for your work and your company, and one thing worth doing about it.</p>",
          "<p>Short, plain-spoken, and worth your five minutes — that's the deal. Unsubscribe any time with one click; no hard feelings.</p>",
          "<div style='margin:26px 0;padding:20px 22px;background:#f4f1e8;border-radius:12px;'>",
          "<p style='margin:0 0 6px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#8a7a3a;'>A gift for joining</p>",
          "<p style='margin:0 0 14px;'><b>Windy Word is yours, free.</b> It's the voice-to-text tool I built by voice — turn the thoughts in your head into clean text on a screen, in 99 languages. It runs entirely on your own machine: no cloud, no subscription, nothing ever leaves your device. The same tool I wrote this whole newsletter with.</p>",
          "<p style='margin:0;'><a href='https://windyword.ai' style='display:inline-block;background:#1a1a1a;color:#f4f1e8;text-decoration:none;padding:11px 22px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;'>Download Windy Word — free →</a></p>",
          "</div>",
          "<p>While you wait for the first issue, the site has the whole story: <a href='https://grantwhitmer.com'>grantwhitmer.com</a></p>",
          "<p>From the eye of the storm,<br>Grant Whitmer</p>",
          "</div>",
        ].join(""),
      }),
    }).catch(() => {})
  );

  return respond(request, true, "You're in — welcome aboard. Check your inbox.");
}
