# thewindstorm.ai

Minimal one-page landing site for **The Windstorm** — Grant Whitmer's weekly newsletter on
AI and human life. One job: capture email signups for the newsletter.

Static HTML/CSS/JS + a single Cloudflare Pages Function. Public, no gate.

## The email list is shared — not a separate copy

Signups here feed the **same list as everywhere else** (grantwhitmer.com, etc.):

- `POST /api/subscribe` (Pages Function, copied verbatim from grantwhitmer-site) →
  writes the member to the shared **D1 `grantwhitmer-admin`** `members` table
  (so it shows up in the grantwhitmer.com `/admin` cockpit) **and** adds the contact to the
  shared **Resend audience** `2f526951-…-b04a7e29ec42`, then sends the welcome email.
- Signups from this site are tagged `source = "thewindstorm-ai"` (hidden form field) so you can
  see where they came from in the cockpit member registry.
- Issues are drafted/reviewed/sent from the existing grantwhitmer.com cockpit — this site only collects.

## Bindings & env (Cloudflare Pages project `thewindstorm`)

Set in `wrangler.toml` (non-secret) + as a Pages **secret** (the key):

| name | where | value |
|---|---|---|
| `DB` (D1) | wrangler.toml | grantwhitmer-admin `c4d5aabe-…` |
| `RESEND_AUDIENCE_ID` | wrangler.toml `[vars]` | `2f526951-…-b04a7e29ec42` |
| `MAIL_FROM` | wrangler.toml `[vars]` | `The Windstorm <eye@thewindstorm.ai>` |
| `INQUIRY_TO` | wrangler.toml `[vars]` | `grant@windstorminstitute.org` |
| `RESEND_API_KEY` | **Pages secret** (never in repo) | `re_HZKknWvq_…` (GrantWhitmerSiteV2, full-access) |

## Deploy

GitHub Actions is billing-locked on `sneakyfree` account-wide, so push-to-main does **not**
auto-deploy yet. Deploy manually (keep git == live: commit + push first):

```
CLOUDFLARE_API_TOKEN=<cf god token> CLOUDFLARE_ACCOUNT_ID=193b347aedeaafe35de0b5a534b2d9aa \
  npx wrangler pages deploy . --project-name=thewindstorm --branch=main --commit-dirty=true
```

The `.github/workflows/deploy.yml` is in place and will auto-deploy once GitHub billing is cleared
(add repo secret `CF_API_TOKEN` = the Pages token).

- CF account: `193b347aedeaafe35de0b5a534b2d9aa`
- Custom domains: `thewindstorm.ai`, `www.thewindstorm.ai` (proxied CNAMEs → `thewindstorm.pages.dev`;
  the domain's email records — MX/DKIM/SPF for windymail — are untouched).
- Repo: `sneakyfree/thewindstorm-site`

## YouTube

Channel link on the page → https://www.youtube.com/@TheWindstormAI
