# Feedback Worker

Cloudflare Worker that receives feedback POSTs from the in-game modal and
forwards them to a Discord webhook. No database, no auth UI — Discord is the
record AND the admin view.

## Status (2026-11-17)

**Live** at `https://feedback.foodempiretycoon.com` (deployed + smoke-tested 2026-11-17). Changes since the April attempt:

- **Endpoint:** `https://feedback.foodempiretycoon.com` — `[[routes]]` with
  `custom_domain = true` is now on in `wrangler.toml`, so no `workers.dev`
  subdomain is needed (that was the April blocker). `FEEDBACK_ENDPOINT` in
  `js/ui/FeedbackManager.js` already points here.
- **CORS:** `ALLOWED_ORIGIN` is a comma-separated allowlist (prod, www, and
  `http://localhost:8080`). Other origins — and requests with no `Origin`
  header, like plain curl — get 403.
- **Abuse guards:** hidden `website` honeypot field (filled = silently
  dropped), `allowed_mentions: { parse: [] }` so player text can't ping
  `@everyone`, and player IPs are no longer posted to Discord (country only).
- **Wrangler:** the latest Wrangler needs Node 22+; this machine has Node 20.
  Use the pinned version: `npx wrangler@4.86.0 ...`.

### Redeploy / rotate (from `worker/`)

1. `npx wrangler@4.86.0 login` — the old OAuth session expired.
2. **Rotate the webhook** (the April one was pasted into a chat session):
   delete it in Discord, create a new one in the feedback channel, run
   `npx wrangler@4.86.0 secret put DISCORD_WEBHOOK_URL` and paste the new URL
   at the hidden prompt (keeps it out of shell history and chat logs).
3. `npx wrangler@4.86.0 deploy` — creates the DNS record + certificate for
   `feedback.foodempiretycoon.com` (~30s for the cert).
4. Smoke-test with the curl command below, then deploy the site.

## One-time setup

### 1. Create the Discord webhook

1. In your Discord server, pick a channel (e.g. `#food-empire-feedback`).
2. Channel settings → **Integrations** → **Webhooks** → **New Webhook**.
3. Copy the **Webhook URL** — it looks like `https://discord.com/api/webhooks/<id>/<token>`.
4. Treat it like a password — anyone with this URL can post to the channel.

### 2. Install Wrangler (once)

```bash
npm install -g wrangler
wrangler login
```

### 3. Set the webhook secret (from `worker/`)

```bash
cd worker
wrangler secret put DISCORD_WEBHOOK_URL
# Paste the webhook URL when prompted. It's stored encrypted in Cloudflare.
```

### 4. Deploy

```bash
wrangler deploy
```

Wrangler prints the deployed URL — something like
`https://food-empire-feedback.<your-account>.workers.dev`.

### 5. Wire the URL into the game

Open `js/ui/FeedbackManager.js` and replace the `FEEDBACK_ENDPOINT` constant
with the URL from step 4. Commit + `git pull` on the Pi.

### 6. Tighten CORS (after you confirm it works)

In `worker/wrangler.toml`, change:

```toml
ALLOWED_ORIGIN = "*"
```

to:

```toml
ALLOWED_ORIGIN = "https://foodempiretycoon.com"
```

Then `wrangler deploy` again.

## Testing

### Smoke test from the command line

```bash
curl -X POST https://feedback.foodempiretycoon.com \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://foodempiretycoon.com' \
  -d '{"type":"bug","message":"Test from curl","name":"Carson","context":{"day":12,"money":4500,"businessType":"foodTruck","difficulty":"normal","gameVersion":"0.31.0"}}'
```

Should return `{"ok":true}` and post a colored embed in your Discord channel.

### From the game

Hard-refresh the browser (Ctrl+Shift+R), open the game, click 💬 Feedback in
the actions panel (or the "Send feedback" link in the landing footer), fill it
in, hit Send. Discord pings.

## What gets sent

The Worker forwards a Discord embed with:

- **Title** — type label (Bug / Feature idea / Other) + game name
- **Description** — the user's message
- **Author** — "From: <name>" if provided, else "Anonymous"
- **Fields** — game state context (day, business type, money, difficulty,
  reputation, employees, viewport, version, country, user agent, path)
- No IP address (removed 2026-11 — country field only)

No save data, no localStorage contents, no personal info beyond what the user
optionally types into the contact field.

## If you want to stop using it

```bash
npx wrangler@4.86.0 delete
```

That deletes the Worker. Set `FEEDBACK_ENDPOINT` to an empty string in the
game JS so the modal surfaces a "not configured" notice instead of failing
silently. Or remove the modal entirely.

## Future: spam protection

Already in place: origin allowlist, honeypot field, no Discord mentions.
If the channel still gets junk, layer in **Cloudflare Turnstile** (invisible
challenge, free) on the modal, or a Workers rate-limiting binding keyed by IP.

## Future: changelog of resolved feedback

Out of scope for v1. Approach when ready:

1. Resolve a feedback item in Discord by reacting with ✅
2. A second Worker on a cron pulls reacted items and writes them to a KV
   store or a JSON file in the repo
3. Game pulls that JSON and renders a public "Recently fixed" list

Keeps moderation simple — only stuff you've explicitly approved makes it
public.
