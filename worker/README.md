# Feedback Worker

Cloudflare Worker that receives feedback POSTs from the in-game modal and
forwards them to a Discord webhook. No database, no auth UI — Discord is the
record AND the admin view.

## Status (resume here — paused 2026-04-30)

Mid-deploy. Already done on this machine:

- Wrangler installed via `npx` (global `wrangler` is not on PATH — use `npx wrangler …`)
- Authenticated against the Cloudflare account (`npx wrangler whoami` confirms)
- `DISCORD_WEBHOOK_URL` secret uploaded (piped via stdin to keep it out of shell history)
- Worker `food-empire-feedback` auto-created and code uploaded — `wrangler deploy` runs cleanly up to publish

**Blocked on a one-time account gate:** this Cloudflare account has no `workers.dev`
subdomain registered, so the deploy has nowhere to publish. Pick one path to resume:

### Path A — Register a `workers.dev` subdomain (simplest, ~30s)

1. Open [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → onboarding (the deploy error prints the exact link)
2. Pick a subdomain (e.g. `carsoncaplan`). Worker URL becomes `https://food-empire-feedback.<subdomain>.workers.dev`
3. From `worker/`: `npx wrangler deploy`
4. Skip to "Wire the URL into the game" below

### Path B — Bind a custom subdomain on the existing zone

Cleaner-looking forever, but pins the endpoint to a specific subdomain on `foodempiretycoon.com`.

1. In `wrangler.toml`, uncomment the `[[routes]]` block:
   ```toml
   [[routes]]
   pattern = "feedback.foodempiretycoon.com"
   custom_domain = true
   ```
   `custom_domain = true` makes Cloudflare auto-create the DNS record + provision SSL — no manual DNS work.
2. From `worker/`: `npx wrangler deploy` (cert provisioning takes ~30s)
3. Endpoint becomes `https://feedback.foodempiretycoon.com`

### After whichever path

1. **Wire the URL into the game** — replace `FEEDBACK_ENDPOINT` in `js/ui/FeedbackManager.js` with the deployed URL
2. **Smoke-test** with the curl command in the Testing section below
3. **Tighten CORS** — flip `ALLOWED_ORIGIN = "*"` → `"https://foodempiretycoon.com"` in `wrangler.toml`, then `npx wrangler deploy` once more
4. **Rotate the webhook** — the original URL was pasted into chat during this session. Delete + recreate it in Discord, then re-run `printf '%s' '<new-url>' | npx wrangler secret put DISCORD_WEBHOOK_URL` and redeploy

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
curl -X POST https://food-empire-feedback.<your-account>.workers.dev \
  -H 'Content-Type: application/json' \
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
- **Footer** — Cloudflare-detected IP (use sparingly; useful for repeat
  offenders if abuse becomes a thing)

No save data, no localStorage contents, no personal info beyond what the user
optionally types into the contact field.

## If you want to stop using it

```bash
wrangler delete
```

That deletes the Worker. Set `FEEDBACK_ENDPOINT` to an empty string in the
game JS so the modal surfaces a "not configured" notice instead of failing
silently. Or remove the modal entirely.

## Future: spam protection

If the channel starts getting junk, layer in **Cloudflare Turnstile**
(invisible challenge, free) on the modal — see Cloudflare docs. Or rate-limit
by IP in the Worker using the Cloudflare KV store. Neither is needed at v1
for the volume we expect.

## Future: changelog of resolved feedback

Out of scope for v1. Approach when ready:

1. Resolve a feedback item in Discord by reacting with ✅
2. A second Worker on a cron pulls reacted items and writes them to a KV
   store or a JSON file in the repo
3. Game pulls that JSON and renders a public "Recently fixed" list

Keeps moderation simple — only stuff you've explicitly approved makes it
public.
