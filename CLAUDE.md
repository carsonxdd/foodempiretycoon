# Food Empire Tycoon — Development Context

Browser-based food-truck sim built with vanilla HTML/CSS/JS. Start with a food truck and $5,000 (normal), work toward a $1M business. Grounded, slightly gritty simulation — real food-truck vibes, not arcade excess.

## How to run

```bash
# Windows batch file — starts Python HTTP server and opens the browser
D:\homework\projects\run\FoodEmpire_Run.bat

# Or manually
python -m http.server 8080
# Visit http://localhost:8080
```

## Hosting

Production is self-hosted on a Raspberry Pi, served at **[foodempiretycoon.com](https://foodempiretycoon.com)** since 2026-04-25. Request path: Cloudflare proxied DNS (apex + `www` CNAMEs) → outbound Cloudflare Tunnel (`cloudflared` systemd service on the Pi) → nginx (dual-stack `listen` on 80 + 443, Cloudflare origin cert) → static files served from the project root. No port forwarding on the router, no static IP. Since the game is a static SPA (no build step, no backend, all state in `localStorage`), deploys are just a `git pull` on the Pi after pushing to GitHub (`origin/main`) — no nginx reload needed.

## Feedback system

In-game feedback button (💬 in the business actions row + "Send feedback" link in the landing footer) opens a modal with three types (Bug / Feature / Other), required message field, and an optional name field for non-anonymous reports. Auto-attaches a small game-state snapshot (day, business type, money, difficulty, reputation, employee count, viewport, version, user agent, path) to help triage — no save data, no localStorage contents.

Submit posts JSON to a Cloudflare Worker (`worker/feedback.js`) which validates, then forwards to a Discord webhook stored as a Worker secret (`DISCORD_WEBHOOK_URL`). Discord is the durable record AND the admin UI — no database, no auth panel to maintain. Setup steps in `worker/README.md`. Endpoint URL lives in one constant (`FeedbackManager.FEEDBACK_ENDPOINT` in `js/ui/FeedbackManager.js`).

`window.GAME_VERSION` (set in `main.js`) ships with every report so bugs correlate to releases. Bump when shipping meaningful gameplay changes.

Future: a `worker/changelog.js` (not built yet) could pull ✅-reacted Discord messages into a public "recently fixed" feed — keeps moderation simple by only surfacing items you've explicitly approved.

## AI + search discoverability

Four files at the repo root + a beefed-up `<head>` block get this game mentioned when someone asks ChatGPT/Claude/Perplexity for "food truck simulator game" or "games about starting a food truck":

- **`llms.txt`** — markdown summary per [llmstxt.org](https://llmstxt.org) convention. Hook, description, features, links, topics. Some AI crawlers look here first.
- **`robots.txt`** — explicit Allow rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, FacebookBot + standard search crawlers. References `sitemap.xml` and `llms.txt`.
- **`sitemap.xml`** — single-URL sitemap pointing to root. Single-page app, but helps search engines.
- **`<head>` in `index.html`** — SEO `<title>` + `<meta name="description">`, keywords, canonical URL, full Open Graph (Facebook/Discord/LinkedIn), Twitter Card, theme color, and JSON-LD `VideoGame` schema.org markup with genre, pricing, author.

**Reality check**: none of these are magic buttons. AI discoverability is a slow compound game — training-based answers take months; live-search-based answers (ChatGPT with search, Perplexity) pick up faster. The combo matters, not any one file. Update `llms.txt` + schema description when the game changes meaningfully so crawlers re-index current copy.

**Hard-refresh (Ctrl+Shift+R) after code changes.** The cache holds JS/CSS aggressively.

Parse-check JS before assuming edits work:
```bash
node -c js/game/BusinessLogic.js   # etc.
```

## File layout

```
index.html                         Markup for landing, setup wizard, game tabs, day modal
css/styles.css                     Full design system — tokens, components, responsive
js/main.js                         Bootstrap, error handling, beforeunload autosave
js/modules/
  GameData.js                      Static data: foods, employees, locations, events, costs,
                                   supplier types, recipe addons, fix-hints
  GameState.js                     Observable state (observer pattern)
  TutorialManager.js               Action-driven coach card
  SoundManager.js                  Procedural Web Audio SFX (no asset files), mute persistence
js/game/
  BusinessLogic.js                 Daily sim math — customers, revenue, costs, events,
                                   regulars, recipe consumption
  GameController.js                Event handlers, user actions
js/ui/
  UIManager.js                     All DOM rendering, modal management
  SetupManager.js                  Setup wizard step flow (food → name → location → difficulty)
  FeedbackManager.js               In-game feedback modal — posts to Cloudflare Worker
worker/
  feedback.js                      Cloudflare Worker — receives feedback POSTs, forwards to Discord
  wrangler.toml                    Worker config (secrets via `wrangler secret put`)
  README.md                        Deploy + Discord webhook setup instructions
```

## Design system

CSS variables live in `:root` at the top of `styles.css`. Use them — don't hard-code.

**Palette:**
- `--bg` `#0d0f1a` (deep navy, not pure black)
- `--surface` `#151828`, `--surface-2` `#1d2235`
- `--text` `#e8eaf0`, `--text-muted` `#9da5b8`
- `--amber` `#ffca58` (headings, money focus)
- `--green` `#7ee787` (money, success)
- `--blue` `#58a6ff` (interactive, info)
- `--coral` `#ff6b6b` (danger, loss)
- `--magenta` `#c678dd` (viral moments)

**Spacing (4px base):** `--s-2xs` through `--s-2xl` (0.25rem → 3rem).
**Type:** `--t-xs` through `--t-3xl` (fluid clamp values).
**Motion:** `--t-fast` 120ms, `--t-normal` 200ms, `--t-slow` 360ms.

Base font is **16px**. Retro feel comes from: pixel font on headings (`Press Start 2P`), VT323 body, subtle CRT scanline overlay (`body::before`).

**Accessibility baselines:** 44px tap targets, rem-based sizing, no hover-only interactions, breakpoints at 1024/768/480.

## Core mechanics

### Setup
Order: **Food → Business Name → Location → Difficulty → Review**. Four foods (Sandwiches $7, Pizza slice $4.50, Tacos $3.50, Burgers $7) — starter prices reflect the bare-bones default recipe. Three locations (Riverside/University/Business District) with different customer demographics and rent. Three difficulties (Easy $7k, Normal $5k, Hard $3k).

### Opening week
Days 1–7 use a special customer formula. Employee/upgrade/marketing bonuses don't apply — real-feel grind.

- **Normal / Hard:** base 1–3 walkups, day curve 0.66 → 1.0 across the week, capped at 6. Difficulty multiplier is *not* applied (everyone shares the brutal opening).
- **Easy:** base 3–6 walkups, day curve 0.97 → 1.0 (almost flat), capped at 12, and `difficulty.customerMultiplier` (1.30) *does* apply. Day 1 at University Square typically lands at 5–9 walkups instead of 1–2. Player will still bleed a little from fixed overhead in week 1, but it's playable, not punishing.

### Regulars
Build up past day 7 on profitable days. Cap 30 on food truck, 80 restaurant, 200 chain. Lost to bad reviews, health scares, and lost-sales days. 70–100% of regulars show each day.

### Recipe system
Recipes are **per-food** and layered on top of bulk **category stockpiles**:

- **Bulk categories** (state + supplier keys): `bread`, `vegetables`, `meat`, `cheese` (display name "Dairy"), `drinks`, `sides`. Suppliers sell the category in bulk. Inventory is tracked per category.
- **Per-food core recipes** — each food in `GameData.foodTypes` declares its own `coreRecipe` (the *required* cores for a real version of this dish):
  - **Burger**: bread + meat + cheese → Bun / Beef Patty / Sliced Cheese
  - **Sandwich**: bread + meat + cheese → Sliced Bread / Turkey / Swiss
  - **Taco**: bread + meat + cheese → Tortilla / Ground Beef / Cheddar
  - **Pizza**: bread + vegetables + cheese → Dough / Tomato Sauce / Mozzarella (no meat core; pepperoni is optional)
  - Missing any food-specific core = **−15% conversion per missing slot** (a burger without lettuce is fine; a burger without a patty is not).
- **Menu-facing display names** — each food has a `coreNames` map translating the bulk key to its dish-specific name. Recipe chips and inventory show "Bun (from Bread stock · 1/sale)", not "Bread."
- **Addons (toppings)**: `GameData.recipeAddons` — lettuce, tomato, bacon, mushrooms, onions, pickles, sauce, jalapeños, plus food-specific ones below. **Not** suppliers — each consumes extra units of its parent category per sale (bacon = +1 meat, lettuce = +1 veg, sauce = +1 dairy) plus a price bonus and conversion bump.
- **Food-specific addons** — each addon has an optional `foods: [...]` tag restricting which food's Recipe tab offers it (`UIManager.updateRecipePanel` filters on it; omit the tag for an addon that fits everything, like tomato/onions/sauce). Gives every food a distinct topping identity instead of one shared universal list:
  - **Pizza-only**: Parmesan (dairy), Spicy Peppers/pepperoncini (veg), Fresh Basil (veg), Pepperoni (meat — pizza's *only* meat option, since its core has none).
  - **Taco-only**: Sour Cream (dairy), Cilantro (veg).
  - **Burger-only**: Fried Egg (meat).
  - **Shared specialty**: Avocado (sandwiches, burgers, tacos).
  - Old saves with an addon no longer tagged for their food type still show that chip (so it can be toggled off) — see the `|| currentRecipe.includes(key)` fallback in `updateRecipePanel`.
- **Addon-specific guest reactions** — `GameData.addonFeedback` maps each addon key to `{ positive: [...], negative: [...] }` lines that only enter the feedback candidate pool when that addon is active in `setup.recipe` (wired into `getContextualFeedback` via the `state` param). A pepperoni-and-parmesan pizza draws different chatter ("Crispy pepperoni cups, exactly how I like it!") than a basil-only one — this is the mechanism behind "guests react to the specific build," not just the food type.

So a burger with bacon + lettuce + onions consumes `1 bread, 2 veg, 2 meat, 1 cheese` per sale. Inventory cap = `floor(inv[k] / consumption[k])` taken over every used category.

Helpers:
- `GameData.getCoreRecipe(foodType)` — per-food required cores.
- `GameData.getCoreDisplay(foodType, key)` — `{ name, icon }` for the dish-specific label.
- `GameData.computeRecipeConsumption(setup)` — aggregated per-sale category map (cores + addon parents + meal extras).
- `GameData.formatCompactMoney(amount)` — `$15,000` → `"$15k"`, `$1,200,000` → `"$1.2M"` for tight UI slots.

### Meal mode
Toggle on Recipe tab. Each sale also consumes 1 drink + 1 side. Adds $5 to the sell price.

### Supplier sliders
Suppliers tab shows all 6 supply types (4 core + 2 meal). Each row: 1–50 unit slider, live unit price + total, bulk tiers (−10% at 50+, −5% at 25+, standard 10–24, +10% under 10). Hard mode prices drift ±15% daily with ±30% shocks 10% of the time — shown as ▲/▼ arrows.

### Premium tiers
Per-supplier Basic/Premium pill. Unlock requires **both** day ≥ 30 AND 10+ orders with that specific supplier ("befriend"). Premium costs 1.8× basic. Each premium core ingredient in active recipe adds **+3% conversion**.

### Pricing control + live economics
Business tab's **Menu pricing** card is a 4-tile live economics panel:
- **Sell price** — base + addons + meal bonus, times the price multiplier. +/− buttons clamped 50%–150% of base. Conversion shifts inversely.
- **Cost per sale** — `BusinessLogic.calculatePerSaleIngredientCost()` walks current consumption × base unit × supplier tier × market price, plus $0.40 packaging/gas.
- **Profit per sale** — sell − cost, colored green/coral with margin %.
- **Break-even price** — `calculateBreakEvenPrice()` = per-sale cost + (daily fixed overhead / expected daily sales). Hint shows "$X above break-even" or "charge $Y more to break even."

All tiles recompute on recipe / tier / market / employee / upgrade / marketing changes via the existing observer dispatch (see `handleStateChange` in `UIManager`).

### Employee leveling
Each employee has a `level` (1–3) and an optional `training` slot. Players pay up front to train an employee toward the next level; training advances daily and completes after a configured number of game days. Employee continues working at current level during training.

| Level | Training cost | Days | Salary mult | Benefit mult |
|---|---|---|---|---|
| L1 | (default on hire) | — | 1.0× | 1.0× |
| L2 | $1,500 | 7 | 1.4× | 1.5× |
| L3 | $3,500 | 14 | 1.9× | 2.0× |

Salaries scale via `GameData.getEmployeeSalary(emp)` — every salary read in BusinessLogic now goes through this helper. Benefit multiplier is applied to all of the employee's existing benefit numbers (conversion bonus, customer capacity, tip income, etc.) via `GameData.getEmployeeBenefitMultiplier(emp)`.

Training also feeds **`fixProgress`** — `_cookProgress` and `_cashierProgress` weight each employee's contribution by `0.4 × benefitMultiplier`. So an L3 cook drives the wait-time complaint progress to ~0.80 alone vs ~0.40 for L1. Training meaningfully reduces complaint frequency, not just background numbers.

UI: each employee row in the panel shows `Cook L2 · $2,520/mo` plus a `Train L3 · $3,500 · 14d` button. While training: `Training L2 — 4d left`. Buttons hide at max level. Daily countdown ticks via the `day` observer.

`BusinessLogic.processEmployeeTraining()` runs after `nextDay()` and bumps levels when `day - startDay >= trainingDays[targetLevel]`. `GameState.load()` backfills `level=1, training=null` on any employee missing those fields, so old saves keep working.

### Reputation tiers
The existing numeric `gameState.reputation` is layered with named tiers for player-facing progress and as a fix-progress lever for marketing complaints.

| Tier | Min rep | Icon | `fixProgress` contribution |
|---|---|---|---|
| Unknown    | 0   | 👤 | 0   |
| Local Spot | 25  | 📍 | 0.3 |
| Buzzing    | 75  | 🔥 | 0.6 |
| Hot Spot   | 200 | ⭐ | 0.9 |
| Iconic     | 500 | 🏆 | 1.0 |

`GameData.getReputationTier(rep)` returns `{ name, icon, min, next, progressContribution, progressToNext }`. The header reputation slot now renders a tier badge plus a thin gradient progress bar to the next tier; the day-modal snapshot shows tier name + icon alongside the number.

The slow-bucket fix rule (`/nobody|dead|market more|still open|question ordering/`) stacks reputation tier with marketing options: an Iconic-rep truck retires "this place is dead" with no marketing spend, a fully-marketed Unknown truck only gets to ~0.71 progress (still earned, but earned faster). Achievements `repLocalSpot` / `repBuzzing` / `repHotSpot` / `repIconic` fire when crossing each threshold.

### Fixed monthly overhead
Food truck: vehicle $160, license $55, permit $20, insurance $70. Restaurant: license $105, permit $35, insurance $140. Chain: license $210, permit $70, insurance $280. Plus rent (location-based — Riverside $630, University Square $460, Business District $880 — scaled 2.5× restaurant, 4× chain) and employee salaries (cook $600/mo, cashier $400/mo at foodTruck; chef $1,000, server $500, manager $900 at restaurant, before level multipliers). Finances panel on Business tab shows every line + break-even. See "Balance fix" in iteration history for why these are ~⅓ of the original numbers.

### Events
7% daily trigger rate, 25-type weighted pool (weather, food critic, equipment breakdown, bad review, staff quit, regular's birthday, tourist photo, etc). Each type has 3–5 message variants. Hard mode extras: 15% ingredient spoilage without fridge, 2% daily employee turnover.

### Rival truck
A named competitor (`GameData.rivalNames`, `GameState.rivalTruck = { name, momentum }`) with a 0–100 momentum stat, 50 = neutral. `BusinessLogic.updateRivalTruck()` runs every day and drifts momentum toward whoever is winning the block — high prices + low reputation favor the rival, and vice versa. Momentum feeds back into `calculateDailyCustomers` as a ±12.5% swing at the extremes (`rivalFactor = 1 - (momentum - 50) / 400`), and into feedback selection via `rivalPressure` (momentum ≥ 65, surfaces `rival` bucket lines) / `rivalDominant` (momentum ≤ 35, surfaces `rivalWin` lines). Crossing the 65 or 35 threshold fires a one-time news entry (`rivalGaining` / `playerDominant` templates) via `GameData.getNewsLine` + `GameState.addNewsEntry`. Storefront panel (Business tab) shows a `🥊 losing ground to <rival>` / `🥊 ahead of <rival>` label with a color-coded progress bar.

### Health inspector
A rare pre-day gate — `GameData.healthInspectorEvent` (2% daily trigger, day ≥ 10, 20-day cooldown via `GameState.healthInspector.lastVisitDay`). `GameController.processNextDay()` calls `checkHealthInspectorTrigger()` first; if it fires, `UIManager.showHealthInspectorModal()` blocks the day (no backdrop dismiss) until the player picks one of three choices, then `resolveHealthInspectorChoice()` resumes the normal day processing:
- **Comply** — flat cost by business type ($150/$250/$400), no risk.
- **Bribe** — cheaper ($60/$100/$150), but a 20% `catchChance` triggers a much bigger cost ($300/$500/$800) plus −15 reputation.
- **Dispute** — free, coin-flip (40% success: +5 rep; 60% fail: −12 rep).

Each outcome posts a news entry (🕵️ normal, 🚨 caught bribe) to the shared `newsFeed`.

### News ticker
`GameState.newsFeed` (capped at 20 entries, `GameState.addNewsEntry`) is a small "word on the street" feed on the Business tab, populated by rival-momentum shifts and health-inspector outcomes today. `UIManager.updateNewsTicker()` renders the 5 most recent, newest first. `GameData.newsTemplates` + `getNewsLine(pool, businessName)` hold the flavor text pools.

### Progression costs
- Food Truck → Restaurant: **$40,000** (~7 months of consistent play — unlocks chef/server/manager employees, bigger capacity, no more truck payment)
- Restaurant → Chain: **$120,000** (3× restaurant; second location, biggest customer base)
- Win: $1,000,000 cash

Progression card sits at the **bottom** of the Upgrades tab (below Equipment) since it's the big-ticket purchase. Button text uses `formatCompactMoney` so "Need $15k" fits in the fixed-width button column.

### Win
$1,000,000 cash. Milestones at $100k / $500k / $1M / $5M give achievement rewards.

## State shape

```js
gameState.state = {
  money: 5000, totalEarnings: 0, reputation: 0, day: 1,
  employees: [{ type, salary, hiredDay, level: 1, training: null|{startDay, targetLevel} }, ...],
  marketing: { hasCameraSetup, hasSocialMediaAds, hasInfluencerCollab,
               followers, lastViralBonus, viralCooldown },
  upgrades: { kitchenEquipment, seating, soundSystem, fridgeUpgrade },
  setup: {
    businessName, foodType, location, difficulty,
    priceMultiplier,                // 0.5 – 1.5
    recipe: ['bread', ...],         // mix of core keys + addon keys
    mealMode: false,
    supplierTiers: { bread: 'basic', ... }  // 6 core+meal suppliers
  },
  business: { type: 'foodTruck'|'restaurant'|'chain', level },
  inventory:      { bread, vegetables, meat, cheese, drinks, sides },
  marketPrices:   { bread, vegetables, meat, cheese, drinks, sides },
  supplierOrders: { bread, vegetables, meat, cheese, drinks, sides },
  regulars: 0,
  history: [{ day, dayName, narrative, feedback, events,
              customers, revenue, costs, netProfit,
              snapshot: { money, reputation, regulars,
                          businessType, employeeCount, followers } }]
}
```

Observer notifications: `money`, `reputation`, `day`, `employees`, `marketing`, `upgrades`, `business`, `setup`, `inventory`, `marketPrices`, `supplierOrders`, `regulars`, `history`, `load`, `reset`.

## Messaging layer

- **Named customer bubbles** in the day modal — 48 random first names, up to 4 bubbles per day, ratio skews to the day's mood. Total is capped at the day's actual `customers` count (0 walkups → no bubbles, 1 walkup → 1 bubble). Normal/Hard: trims negatives first on good days, positives first on bad days. **Easy mode override:** bad days get 2 positive / 1 negative (instead of 1/2), and trim drops negatives first even on bad days — so a 1-walkup losing day surfaces a cheerleader, not a complaint.
- **Visitor / buyer split** — positives are capped at `actualSales` (only buyers can rave about food they didn't eat). Negatives still draw from the full `customers` count, since walkers can complain about why they didn't buy. The `walkers = customers - actualSales` count drives a `walkedAway` pool with proportional pickup ("Saw the price and kept walking", "Line was longer than I had time for"). Easy-mode floor: when `actualSales = 0` and walkers exist, exactly one positive is allowed, drawn from an `ambient` pool of passer-by lines that read fine from a non-buyer ("Smelled incredible walking by!").
- **Feedback pools** bucketed by context: `general`, `viral`, `busy`, `slow`, `supplyShortage`, `walkedAway`, `ambient`, food-type, customer-type, plus:
  - `simpleLovers` / `simpleDetractors` — fires when recipe is just the cores. Some diners love minimalism, others want more toppings. "Can't please everyone."
  - `loadedLovers` / `loadedDetractors` — fires when recipe has 3+ extras beyond cores. Some love the gourmet pileup, others find it overloaded.
- **Fix hints — graded `fixProgress`.** `GameData.fixHints` is a list of `{ match, text, fixProgress(state) }` rules where `fixProgress` returns 0..1 — the share of the suggested lever the player has already pulled. Multiple levers stack with parallel reduction (`1 - (1-a) * (1-b)`). The keyword regex picks the matching rule; `GameData.getFixHintInfo(message, state)` returns `{ text, progress, redundant }` with `redundant = progress > 0.7`. `GameData.computeFixProgress(message, state)` is used directly by selection logic. Two layers act on it:
  1. `getContextualFeedback` weights each negative candidate by `max(0.05, 1 - progress)` when picking, so partially-fixed complaints surface less often and fully-fixed ones effectively retire (the 0.05 floor lets the rare gripe still slip through — even great trucks get bad takes occasionally).
  2. UIManager hides the 💡 line when `progress > 0.7` so a generic complaint that slipped through doesn't carry a nag-worthy hint.
  Rendered as 💡 line under negative bubbles. **Hidden on hard mode.**
  Per-ingredient specificity: "bread was stale" maps to premium *bread* only (not any premium tier), "cheese wasn't melted" to premium *cheese*, etc. Vegetarian complaint requires a *veg* addon (lettuce/tomato/mushrooms), not just any addon.
- **Message guards** — `GameData.messageGuards` filters out lines that don't fit the day's shape, regardless of which bucket they're in. Three classes wired today: (1) crowd/line/rush-hour words require `context.busy` *or* `customers >= 6` (so a 1-walkup day never surfaces "Line was longer than I had time for"), (2) empty-room words ("nobody was here", "dead atmosphere") require `context.slow` *or* `customers < 10`, (3) repeat-visit lines ("remembered my order from last time") require `day >= 5`. `getContextualFeedback` calls `passesGuards(message, context)` after pool assembly; falls back to the unguarded pool only if every candidate would be filtered. `BusinessLogic` passes `customers`, `actualSales`, `walkers`, and `day` (closing day) into the context so guards have what they need.
- **Rotating daily report headings** (15 variants), **event messages** (3–5 per type). All track last-shown to avoid immediate repeats.
- **Narrative line** — one short sentence per day summarizing weather + customers + sales + profit.

## Day modal + journal

After each Next Day, a modal pops up with the day's recap: narrative, snapshot tiles (cash/rep/regulars/employees/followers), collapsible numbers, events, chat bubbles. Navigate with ←/→ arrow keys or Prev/Next buttons.

Business tab has a **journal list** of past days (newest first, scrollable). Click any entry to re-open its modal. Full history stored in `gameState.history`.

## Landing page

The front-facing site (before Start Your Empire) is in the `<header>`, `.quote-ticker`, and `<main>` of `index.html`. It's intentionally alive:

- **Hero title** — `.hero-title` has a 3.2s amber `titlePulse` glow + rare 1-frame `titleFlicker` every 9s.
- **Rolling quote ticker** — `#quoteTrack` populated on DOMContentLoaded by `main.js → populateLandingTicker()`. Pulls 8 random lines from `GameData.positiveFeedback` (general/busy/viral/simpleLovers/loadedLovers), attributed to a random `firstNames` entry and a random day 5–94. CSS marquee duplicates the content and translates `-50%` infinitely; pauses on hover.
- **Floating food backdrop** — `.food-backdrop` is a `position: fixed` container of 12 emojis (🍔🌮🍕🥪🥤🍟🧀🥓🥬🍅🌶️🥒) that drift bottom-to-top over 20–36s with rotation + fade. `z-index: 0` behind everything; `pointer-events: none`. Header, ticker, sections, and footer are explicitly `position: relative; z-index: 1` so the emojis only show in the gutters — never over words or text boxes. Lives inside `<main>` so it auto-hides when the setup or game view replaces it.
- **`prefers-reduced-motion: reduce`** turns off title pulse, ticker scroll, and hides the food backdrop entirely.

### Save prompt flow

Page load shows the landing with no dialog. The "Start Your Empire" button (`SetupManager.handleStartClick`) checks `localStorage.foodEmpireGameState`:
- If present: `showResumeModal()` opens `#resumeModal` with a parsed snapshot (business name / day / cash / business type) and two actions — Resume (loads state and goes to game interface) or Start Fresh (resets state + clears the save + opens the setup wizard).
- If absent: goes straight into the setup wizard.

## Tutorial flow

Floating coach card bottom-right (`.tutorial-coach`). Six steps:
1. Welcome — stock up first
2. Point at inventory panel
3. Click Suppliers tab
4. Order an ingredient
5. Click Business tab
6. Click Next Day, then goal reveal ($1M)

Advances on real user actions when possible. Stored at localStorage key `foodEmpireTutorialDone_v2`. Manual restart via "Show Tutorial" button.

## Immersion & polish

- **Keyboard shortcuts** — `1`–`6` switch tabs (Business/Recipe/Suppliers/Employees/Marketing/Upgrades) via `GameController.handleKeyboardShortcuts`, guarded off when typing in an input or when `#gameInterface` is hidden (landing/setup screens). `n` still advances the day, `Ctrl+S`/`Ctrl+L` save/load.
- **Resume flavor** — `GameData.resumeFlavor` is a pool of gritty one-liners ("Rent's still due. The regulars kept coming."), one picked at random by `GameData.getResumeFlavor()` and rendered as a `.resume-flavor` line under the snapshot in the Resume modal (`SetupManager.showResumeModal`).
- **Milestone celebration** — `UIManager.celebrate()` fires a short full-screen radial flash + 16 falling-emoji particles (CSS `milestoneFlash`/`confettiFall` keyframes), auto-removed after ~1.4s, particles skipped under `prefers-reduced-motion`. Triggered from `GameController.unlockAchievement` only for real milestones — cash/reputation thresholds and `millionaire` — not the minor ones (first hire, first upgrade, social media).
- **Sound design** — `js/modules/SoundManager.js` synthesizes short SFX with the Web Audio API, no asset files: `sale` (ascending blip on a day with sales), `pageFlip` (noise tick on day-modal prev/next nav), `achievement` (3-note arpeggio, paired with `celebrate()`). `AudioContext` is created lazily on first `play()` since most browsers require a user gesture to start it. Mute state persists at `localStorage.foodEmpireSoundEnabled`, toggled via the 🔊/🔇 button in the business-actions row (`GameController.updateSoundButton`).
- **Weather day-modal tint** — `UIManager.openDayModal` checks that day's `history` entry for a weather-type event (`sunny_day`/`rainy_day`/`cold_snap`/`heatwave`) and toggles a matching class on `.day-modal-card` via `applyWeatherTint` (rain streaks, sun glow, cold wash, heat shimmer — CSS `::before` overlay scoped to the card, doesn't fight the page-level CRT scanline), cleared on close. Most days have no event at all (7% trigger rate), so most day-modals show no tint — that's correct, not a bug.
- **Live storefront visual** — `UIManager.updateStorefrontVisual()` renders `#storefrontPanel` on the Business tab: business-type icon (🚚/🏢/🏙️), reputation-tier crowd dots (`GameData.reputationTiers` index + 1 dots), upgrade badges (🪑 seating, 🎵 sound system), and a corner weather icon from the most recent day's event. Wired into `handleStateChange` for the `upgrades`/`business`/`reputation`/`day` cases — no new observer type needed.

## Balance sanity checks — read before touching any economy number

Any change to `GameData.employeeTypes[*].salary`, `GameData.fixedCosts`, `GameData.supplierTypes[*].basePrice`, `GameData.foodTypes[*].basePrice`, a location's `modifiers.rentCost`, or the disposables constant in `BusinessLogic.calculateDailyCosts` / `calculatePerSaleIngredientCost` can silently make the game unwinnable. It already happened once (iteration 34 below): supplier prices, the disposables charge, and fixed overhead were each individually plausible-looking, but combined they meant every food item lost money on ingredients alone, before a single fixed cost was counted — 100% bankruptcy rate on every difficulty, and it wasn't obvious from reading the numbers in isolation.

Before shipping a change to any of the above, verify:

1. **Ingredient margin.** At a 1.0x price multiplier, `calculatePerSaleIngredientCost()` for a food's *core-only* recipe should land around 30-40% of that food's `basePrice`. Anywhere near or above 100% means the item loses money on every sale, full stop, regardless of volume or fixed costs — no fixed-cost tuning can rescue that.
2. **Fixed-cost coverage.** `calculateDailyFixedCosts()` for a foodTruck at a mid-tier location, divided by a realistic day-8-30 sales volume (~20-30/day on Normal at a 1.2-1.3x price), needs to be coverable by that volume's contribution margin. If `calculateBreakEvenPrice()` at that volume exceeds the food's max legal price (`basePrice * 1.5`), the business cannot reach profitability no matter how well the player plays.
3. **Don't trust `netProfit` alone.** `processDailyBusiness()`'s returned `netProfit` excludes real ingredient cost (see Known quirks below) — it only reflects the $0.40/sale disposables charge, not the bulk-purchased ingredients. Track `gameState.money` before/after a day instead, or a "profitable-looking" day can still be bleeding real cash.

**Fast way to check — no manual clicking required.** Open the running game in Chrome DevTools (or via the `claude-in-chrome` skill) and drive the engine directly from the console:
```js
const gc = window.FoodEmpire.getGameController();
const bl = gc.businessLogic, gs = gc.gameState;
gs.updateSetup('foodType', 'tacos');              // cheapest food = worst case
gs.updateSetup('location', GameData.locations[1]); // University Square
gs.addEmployee({type:'cook', salary: GameData.getEmployeeType('cook').salary, hiredDay:1, level:1, training:null});
gs.addEmployee({type:'cashier', salary: GameData.getEmployeeType('cashier').salary, hiredDay:1, level:1, training:null});
const food = GameData.getFoodTypeData(gs.setup.foodType);
console.log('ingredient cost:', bl.calculatePerSaleIngredientCost(), 'vs base price:', food.basePrice);
console.log('fixed $/day:', bl.calculateDailyFixedCosts());
console.log('break-even at day-1 setup:', bl.calculateBreakEvenPrice(), 'vs max legal price:', food.basePrice * 1.5);
```
For a real multi-day survival check (the thing that actually caught the iteration-34 bug), loop `bl.processDailyBusiness()` from the console across dozens of simulated days and several seeds — call `gs.reset()` between runs — instead of clicking Next Day by hand hundreds of times. Track `gs.money` before/after each call, not `netProfit`. Sweep all four foods and all three difficulties (Easy should stay comfortably ahead, Hard should be tight but not a guaranteed loss) before considering an economy change safe to ship.

## Common dev tasks

**Add a new food type:**
1. Add to `GameData.foodTypes` with `basePrice`, `coreRecipe`, `defaultRecipe`, `coreNames`, `customerAppeal`
2. Add button in `index.html` setup step 1
3. (Optional) Add food-specific feedback bucket in `GameData.positiveFeedback`/`negativeFeedback`

**Add a new core ingredient / supplier:**
1. Add to `GameData.supplierTypes` with `{ name, icon, basePrice, description, isCore: true }`
2. Add to `GameState.state.inventory`, `marketPrices`, `supplierOrders`, `supplierTiers` defaults
3. Add to starter inventory in `SetupManager.beginGame`
4. Add fix-hint keywords if appropriate in `GameData.fixHints` (with `redundantIf(state)` if it points at a lever the player can complete)
5. `UIManager.updateSuppliersTab` auto-renders — no markup needed

**Add a new addon / topping:**
1. Add to `GameData.recipeAddons` with `{ name, icon, parent, consumption, priceBonus, appealBonus, description }`
2. Recipe tab auto-renders from `recipeAddons` — no markup or state changes needed
3. Consumption flows through `computeRecipeConsumption`

**Add a new event type:**
1. Add to `GameData.eventCatalog` with `type`, `icon`, `weight`, effect fields
2. Add 3–5 message variants to `GameData.eventMessages[type]`
3. Declarative effects handled by `BusinessLogic.applyEventEffects` — no extra code needed

**Add a new cost line:**
1. Add to `GameData.fixedCosts` per business type (monthly value)
2. Add daily-share calculation in `BusinessLogic.calculateDailyCosts`
3. Return it in the costs object; `UIManager` renders finances panel from the same data
4. Run the "Balance sanity checks" above before shipping — a new cost line changes the fixed-cost total that every food's break-even price depends on

**Change an existing salary, rent, supplier price, or base food price:**
1. Make the edit in `GameData.js`
2. Run the "Balance sanity checks" above (ingredient margin + fixed-cost coverage + multi-day survival sweep) before committing — this exact category of change made the game unwinnable once already (iteration 34)
3. Update the dollar figures documented in this file (Fixed monthly overhead, Progression costs, etc.) and in `README.md` so the docs don't drift from the code

## Known quirks

- `autoSave` skips when `setup.businessName` is empty — this is why restart/newGame reset state first (otherwise `beforeunload` rewrites the save on reload).
- Ingredient cost paid at supplier-order time — `calculateDailyCosts` doesn't charge per-sale ingredients. Only $0.40/sale disposables (gas/packaging). This split bit us once already (see "Balance fix" in iteration history) — a simulation that only reads `netProfit` from `processDailyBusiness()` will look healthier than the real cash balance, since bulk ingredient purchases land separately via `orderSupplies`.
- Conversion rate is clamped 10%–95% regardless of penalties.
- The in-game "Show Tutorial" button uses a native `confirm()` for restart — good enough for manual trigger.
- Addons don't appear on Suppliers tab (by design) — they're recipe modifiers only. Managed on Recipe tab.

## Iteration history

1. Bug sweep — removed double-confirm on camera, fixed ingredient cost desync, stacked notifications.
2. Design tokens + larger components (pre-rewrite).
3. Full feel-real pass — opening week, regulars, inventory as real constraint, slower social growth, 25-event catalog, $1M win target.
4. Full CSS rewrite — navy palette, scanlines, compact sizing, 180ms tab crossfades.
5. Chat-bubble messaging — named customers, narrative summary, contextual feedback pools.
6. Tutorial rebuild — action-driven coach card with progress dots.
7. Starting week tightening, food reorder (food → name), added Tacos + Burgers, inventory panel.
8. Real fixed costs (vehicle/license/permit/insurance), finances breakdown, adjustable selling price.
9. Option hover fixes, desktop text bumps, ingredient rename to bread/veggies/meat/cheese, recipe card.
10. Meal mode, editable recipe toggles, drinks + sides as ingredients, realistic pricing.
11. Supplier sliders with tier pricing, hard-mode market price drift, CLAUDE.md + README refresh.
12. Premium/Basic supplier tiers (day 30 + 10 orders unlock gate), base font 14→16px, supplier row spacing.
13. Daily summary modal + journal history scroll with prev/next navigation.
14. Marketing/upgrades grid layout fix (fixed-width button column, no more button taking over).
15. Recipe builder tab with Core + Toppings sections, addon ingredients (bacon/mushrooms/etc), suppliers filter by recipe.
16. Suppliers unfiltered — show all with recipe-status badges + quick "Add to recipe" button.
17. Actionable complaint hints — 💡 fix tips under negative bubbles, hidden on hard mode.
18. Addon restructure — toppings consume from parent category (bacon = +1 meat) instead of their own inventory. Suppliers page back to 4 core + 2 meal.
19. Recipe toggle bug fix + per-food display names (Bun/Beef Patty/Sliced Cheese for burgers, Tortilla/Ground Beef for tacos, etc.) via `coreNames`. Cheese category renamed "Dairy" at display level; Signature Sauce moved to dairy parent. Named customer-facing items, bulk category suppliers.
20. 4-tile live economics on Menu pricing (sell / cost / profit / break-even), with `calculatePerSaleIngredientCost` / `calculateBreakEvenPrice` / `estimateExpectedDailySales` helpers.
21. Per-food `coreRecipe` — burger/sandwich/taco cores are bread+meat+cheese (no veg); pizza is bread+veg+cheese (no meat). Missing-core penalty uses per-food list. Default = core, so players start bare-bones. Base prices lowered to match. Added lettuce + tomato addons.
22. "Can't please everyone" feedback — `simpleLovers`/`simpleDetractors` fire on minimal recipes, `loadedLovers`/`loadedDetractors` on 3+ extras.
23. Progression retune — restaurant $40k, chain $120k (3× ratio). Cash-accumulation curve math: $40k hits ~day 220 with decent play, forcing engagement with premium tiers + meal mode. Progression card moved to the bottom of Upgrades. Button text uses `formatCompactMoney` so "Need $40k" fits. Recipe summary switched from flex to 3-column grid with `minmax(0, 1fr)` so long addon breakdowns wrap inside the price column instead of pushing conversion below the panel.
24. Landing-page life pass — punchy copy ("Your food. Your grind. Your rules."), animated title (amber pulse + CRT flicker), rolling customer-quote ticker pulling from feedback pools, ambient floating food-emoji backdrop behind all content. Save prompt deferred — no popup at page load; Start Your Empire surfaces a styled Resume / Start Fresh modal only when a save exists. Footer refreshed with 2026 copyright + carsoncaplan.com link. `prefers-reduced-motion` fully respected.
25. Public release prep — initialized git, pushed to [github.com/carsonxdd/foodempiretycoon](https://github.com/carsonxdd/foodempiretycoon) with `.gitignore` excluding `.claude/` + temp files. Production hosting on Raspberry Pi at [foodempiretycoon.com](https://foodempiretycoon.com); deploys via `git pull` (static SPA, no build step). AI + search discoverability stack added: `llms.txt` (llmstxt.org convention), `robots.txt` (explicit Allow for GPTBot/ClaudeBot/PerplexityBot/Google-Extended/Applebot-Extended/CCBot + standard search crawlers), `sitemap.xml`, and expanded `<head>` with SEO title + meta description + canonical + Open Graph + Twitter Card + JSON-LD `VideoGame` schema.
26. Live launch (2026-04-25) — wired the existing nginx site into the Pi's Cloudflare Tunnel by adding apex + `www` ingress entries to `/etc/cloudflared/config.yml` (both → `https://localhost:443` with `noTLSVerify: true`, mirroring the pvpers.us pattern), validated, restarted `cloudflared`. Swapped the home-IP A records for proxied CNAMEs (apex + `www`) pointing at the tunnel. End-to-end: HTTP/2 200 on apex, www → apex 301, CSS/JS served with 7-day edge cache. Deploy flow confirmed: `cd ~/projects/foodempiretycoon && git pull` — no nginx reload.
27. Bubble count cap — `generateFeedbackBubbles` now takes `customers` and trims the planned positive/negative split down to actual walkups (0 walkups → empty array, 1 walkup → 1 bubble). Negatives drop first on good days, positives first on bad days, so the surviving voices still match the day's mood. Fixes the immersion bug where day-1's single visitor produced 3 named quotes.
28. Repeat-hint fix + easy mode rebalance.
    - **Hint redundancy.** `getFixHint` retired in favor of structured `GameData.fixHints` rules with optional `redundantIf(state)` predicates (sound system owned, has cashier, mealMode on, any premium supplier, recipe has an addon, etc.). New `getFixHintInfo(message, state)` returns `{ text, redundant }`. `getContextualFeedback` accepts `state` and drops negative messages whose hint is already addressed *before* picking — so the complaint and the 💡 line both vanish once the player pulls the lever. UIManager double-checks redundancy when rendering. Fixes the bug where buying the Sound System still produced "Could use some music" complaints the next day.
    - **Easy mode tuning.** Easy `customerMultiplier` 1.15 → 1.30. Opening week on easy: base 3–6 (was 1–3), day curve 0.97 → 1.0 (was 0.66 → 1.0), cap 12 (was 6), and difficulty multiplier now applies in opening week. Bad-day bubble split flips on easy: 2 positive / 1 negative (was 1/2), and trim drops negatives first even on bad days so the surviving voice cheers. Reputation hit on losing days softens to −1 in opening week / −2 after (was flat −3). Normal and Hard are untouched — they're the realism modes. Day 1 at University Square on easy now typically lands ~5–9 walkups → 3–6 sales; player can still post a small loss from fixed overhead but the experience reads supportive.
29. Comment-realism foundation (Phase 1 of the upgrade-aware feedback overhaul).
    - **Graded `fixProgress`.** Binary `redundantIf(state) → bool` retired in favor of `fixProgress(state) → 0..1`. Selection in `getContextualFeedback` switches from filter to weighted random with weight `max(0.05, 1 - progress)` per candidate. Multiple levers stack with parallel reduction (`GameData.stackProgress(...)`). Net effect: every relevant lever pulled by the player measurably reduces the chance of the matching complaint, instead of needing a full retire to take effect.
    - **Coverage gaps closed.** New rules cover the `slow` bucket (marketing options retire "this place is dead"), `busy` bucket (cashier + cook progress for "line stretched"), per-ingredient premium specificity (bread complaints → premium *bread* only, not any premium), and vegetarian-specific complaint (now requires a veg addon, not just any addon — adding bacon doesn't silence it).
    - **Visitor / buyer split.** `generateFeedbackBubbles` now takes `actualSales`. Positives are capped at `actualSales` for normal/hard (only buyers can rave). Walkers (`customers - actualSales`) feed a new `walkedAway` bucket — each negative bubble has a walker-share chance of being a "saw the price and kept walking" line. Easy-mode floor: when `actualSales = 0` and walkers exist, exactly one positive is allowed, drawn from a new `ambient` pool of passer-by lines that read fine from a non-buyer.
    - **Message guards.** New `messageGuards` table filters lines that don't match the day's shape: line/crowd words drop at `customers < 6`, "nobody was here" drops at `customers >= 10`, "remembered my order" drops at `day < 5`. Fixes the immersion bug where a 1-walkup day produced a "Line was longer than I had time for" comment.
    - **Helper static methods** added to `GameData`: `stackProgress`, `_cookProgress`, `_cashierProgress`, `_employeeCountProgress`, `_marketingProgress`, `_premiumProgress(s, key)`, `_anyPremiumProgress`, `_vegAddonProgress`, `_anyAddonProgress(s, perAddon)`.
30. Employee leveling (Phase 2 of the upgrade-aware feedback overhaul).
    - **3-level training ladder.** Each employee gets `level` (1–3) and an optional `training` slot. New `GameData.employeeLeveling` config holds the cost ($1,500 / $3,500), days (7 / 14), salary multipliers (1.0 / 1.4 / 1.9), and benefit multipliers (1.0 / 1.5 / 2.0). Helpers `getEmployeeSalary(emp)`, `getEmployeeBenefitMultiplier(emp)`, and `canTrainEmployee(emp)` keep math centralized.
    - **Training mechanics.** Player pays up front via `BusinessLogic.purchaseEmployeeTraining(index)`; training takes real game days. `processEmployeeTraining()` runs after `nextDay()` and bumps level when `day - startDay >= trainingDays`. Employee works at current level while training. `GameState.load()` backfills `level=1, training=null` on old saves.
    - **Salary scales.** `BusinessLogic.calculateDailyCosts` and `calculateDailyFixedCosts` swapped from reading `empData.salary` directly to `GameData.getEmployeeSalary(emp)` — an L3 cook costs $3,420/mo instead of $1,800. Break-even calculations stay accurate.
    - **Benefits scale.** Conversion bonuses (`calculateConversionRate`), customer-bonus calculation (`calculateDailyCustomers`), and projection (`estimateExpectedDailySales`) all multiply by per-employee benefit multipliers. Best-cashier-of-the-team rule for binary cashier conversion bonus, per-cook-average for the cook bonus.
    - **Levels feed `fixProgress`.** `_cookProgress` is now a parallel stack of `0.4 × benefitMultiplier(level)` per cook (L1=0.40, L2=0.60, L3=0.80 each). `_cashierProgress` takes the best cashier's `0.6 × benefitMultiplier` capped at 1.0. So training a cook visibly reduces "service was slow" frequency, not just background math.
    - **UI: level badge + train button.** Each employee row shows `Cook L2 · $2,520/mo` plus contextual action — `Train L3 · $3,500 · 14d` button when idle, `Training L2 — 4d left` while training, nothing at L3. Daily countdown ticks via the `day` observer, train clicks route through UIManager → `businessLogic.purchaseEmployeeTraining` → notification.
    - **Vague non-actionable bucket.** New `negativeFeedback.vague` pool ("Eh, it was fine.", "Didn't really click for me.") added to default negative selection alongside `general`. These intentionally don't match any `fixHints` rule — no 💡 hint shows. Reminder for future authors: not every dislike needs to point at an upgrade. Naturally takes over selection in a fully-fixed state, which is the right shape (no specific levers left to suggest).
31. Reputation tiers (Phase 3 of the upgrade-aware feedback overhaul).
    - **5 tiers layered on existing `reputation`.** `GameData.reputationTiers` defines Unknown (0) → Local Spot (25) → Buzzing (75) → Hot Spot (200) → Iconic (500), each carrying an icon and a `progressContribution` (0/0.3/0.6/0.9/1.0). `GameData.getReputationTier(rep)` returns the current tier plus `progressToNext` for the UI bar. No new state — uses the existing observer dispatch.
    - **Tier feeds `slow` fixProgress.** The "this place is dead" rule now stacks marketing progress (max ~0.71) with reputation tier (up to 1.0) via parallel reduction. Iconic alone fully retires the complaint; Hot Spot + just one marketing option does too. Without rep OR marketing, complaint surfaces normally.
    - **UI: tier badge + progress bar.** Header reputation slot renders `🔥 Buzzing 142` with a thin amber→green gradient bar showing progress to next tier. Day-modal snapshot shows tier name + icon alongside the number. Tooltip on the tier name reads "X% to <next tier>" or "Maxed".
    - **Tier achievements.** `repLocalSpot` ($500) / `repBuzzing` ($1,500) / `repHotSpot` ($4,000) / `repIconic` ($10,000) achievements unlock at each threshold. `GameController.checkAchievements` now sweeps any achievement with a `reputationThreshold` field (extensible pattern matching the existing `cashThreshold`).
    - **Smoke-tested**: tier boundaries exact, slow-line frequency drops 271 → 34 → 15 / 2000 across Unknown / Hot Spot / Iconic.
32. Feedback Worker deploy — partial (paused 2026-04-30). Got the Worker most of the way to live but stopped short of publish. Done: `npx wrangler` (4.86.0) authenticated against the Cloudflare account; `DISCORD_WEBHOOK_URL` uploaded via `printf '%s' '<url>' | npx wrangler secret put DISCORD_WEBHOOK_URL` (stdin pipe keeps the URL out of shell history); `food-empire-feedback` Worker auto-created on first secret put; `wrangler deploy` uploaded the code cleanly. Blocked on a one-time account gate — no `workers.dev` subdomain registered on this Cloudflare account, so Wrangler has nowhere to publish. Two resume paths now documented in `worker/README.md` "Status" section: (A) register a workers.dev subdomain in the dashboard, then re-run `npx wrangler deploy`; (B) uncomment the `[[routes]]` block in `wrangler.toml` to bind `feedback.foodempiretycoon.com` via `custom_domain = true` (Cloudflare manages the DNS record + cert automatically). After whichever path: paste the deployed URL into `FeedbackManager.FEEDBACK_ENDPOINT`, smoke-test with curl, tighten `ALLOWED_ORIGIN` from `"*"` → `"https://foodempiretycoon.com"`, redeploy. The webhook URL was pasted into chat earlier in the session — rotate it in Discord and re-upload the secret before going live.

    Operational note for future sessions: the global `wrangler` binary is not on this machine's PATH — always invoke as `npx wrangler` from inside `worker/`.
33. Immersion & smoothness pass — six small features aimed at UX friction and game feel, no new mechanics. See "Immersion & polish" section above for details.
    - **Tab hotkeys** — `1`–`6` map to the six business tabs, guarded against input focus and the landing/setup screens.
    - **Resume flavor** — one-liner under the Resume modal snapshot, picked from `GameData.resumeFlavor`.
    - **Milestone celebration** — `UIManager.celebrate()` screen flash + falling particles on cash/reputation/millionaire achievement unlocks.
    - **Sound design** — new `SoundManager.js`, procedural Web Audio SFX (no audio files), 🔊/🔇 toggle, `foodEmpireSoundEnabled` localStorage flag.
    - **Weather day-modal tint** — rain/sun/cold/heat CSS overlay on `.day-modal-card` keyed off that day's random event type.
    - **Live storefront visual** — new `#storefrontPanel` on the Business tab reflecting business type, reputation-tier crowd size, owned upgrades, and the latest weather event.
    - Caught one real bug during testing: browser cache served a stale `GameData.js` after the edit, masking `getResumeFlavor` until a hard refresh — the project's known aggressive-JS-caching quirk, not a code bug.
34. Balance fix — the game was unwinnable on every difficulty (2026-07-09). Found via headless playtesting in Chrome: instead of clicking through the UI, drove `BusinessLogic`/`GameState` directly from the page console across hundreds of simulated days per config. First pass looked like a fixed-cost problem (day-8 net profit was -$94 on a *good* day), but that was misleading — `calculateDailyCosts`'s `ingredientCosts` field is actually just the $2/sale disposables charge (per the documented quirk above), so tracking `netProfit` alone hid the real culprit. Recomputing from `calculatePerSaleIngredientCost()` directly showed the actual bug: raw ingredient cost for any meat-core dish (bread+meat+cheese, 1 unit each) was **$6.30/sale** against a $3.50 taco — negative margin at *any* legal price, even the 1.5× cap. Every food type lost money on ingredients alone before a single fixed cost was counted.
    - **Fix, in order of magnitude**: (1) supplier `basePrice` values cut ~6× (bread 15→2.5, vegetables 12→2, meat 30→5, cheese 18→3, drinks 8→1.5, sides 10→1.5) so core ingredients land around 30% of a $3.50 base price instead of 180%; (2) the flat disposables/packaging charge cut from $2/sale to $0.40/sale in both `calculateDailyCosts` and `calculatePerSaleIngredientCost` (was up to 57% of a taco's revenue on its own); (3) fixed overhead cut ~⅓ of original — employee salaries (cook $1800→$600, cashier $1200→$400, chef/server/manager scaled the same), foodTruck vehicle/license/permit/insurance, and all three location rents — because even with (1) and (2) fixed, the original $172/day foodTruck overhead still couldn't be covered by realistic day-8+ volume (~20-30 sales/day). All three cuts were necessary together; any one alone still bankrupted every seed.
    - **Also fixed**: `UIManager`'s Menu Pricing cost breakdown had `$2 packaging` hardcoded into the hint text separately from the constant, so it would've silently gone stale — now reads the same $0.40 figure. `gameOver('victory')` message said "$10 million" when `GameData.progression.winCondition` is actually $1,000,000 — text-only, unrelated to the balance bug, fixed while in the area.
    - **Verified** by re-running the same headless harness after a hard reload (persisted source, no monkey-patching) across easy/normal/hard × tacos/burgers/pizza/sandwiches, several seeds each, 220 simulated days: zero bankruptcies (previously 100%), brutal-but-recoverable opening week preserved (day 1-7 still bleeds ~$50-60/day on 1-3 walkups, matching intended design), real day-to-day swings post-day-7 (some -$20 days, some +$50 days, not a flat trend), difficulty gradient intact (easy ~$31-34k / normal ~$21-24k / hard ~$11-16k by day 220), burgers/Business District reaching the $40k restaurant threshold around day 135-140. Confirmed live in the browser through the actual setup wizard + Next Day flow, not just headless.
    - **Process note for future balance work**: don't trust `netProfit` from `processDailyBusiness()` as a stand-in for true cash flow when ingredients are involved — track `gameState.money` delta instead, since bulk ingredient purchases (`orderSupplies`) land as a separate, decoupled cash event.
35. Food-specific addon detail (2026-07-09) — each food's Recipe tab now offers its own distinct topping set instead of one shared universal list. Added `foods: [...]` tag to `GameData.recipeAddons` entries (omitted = still universal, like tomato/onions/sauce) and 7 new addons: pizza gets Parmesan/Spicy Peppers/Fresh Basil/Pepperoni (its only meat option — the core has none), tacos get Sour Cream/Cilantro, burgers get Fried Egg, and Avocado is shared across sandwiches/burgers/tacos. `UIManager.updateRecipePanel` filters `recipeAddons` by the tag but always keeps a chip visible if it's already in `currentRecipe`, so an old save with a since-restricted addon can still toggle it off. New `GameData.addonFeedback` pool gives each addon its own positive/negative reaction lines, wired into `getContextualFeedback` (only added to the candidate pool when that addon key is present in `state.setup.recipe`) — so a pepperoni-and-parmesan pizza draws different chatter than a basil-only one, fulfilling the "guests react to the detail" ask rather than just the food type. Also updated `_vegAddonProgress`'s veg list and simplified the bland/seasoning fixHint to `_anyAddonProgress` so new addons count toward those existing levers without a hardcoded list to maintain. Verified via headless console: addon chip lists filter correctly per food, and a 300-sample draw of taco feedback with sourCream/cilantro/avocado active surfaced all three addon-specific lines; 10 simulated days end-to-end produced no errors.
36. Rival truck + health inspector (2026-07-09) — two new mechanics, see "Rival truck" / "Health inspector" / "News ticker" sections above for the full mechanics writeup.
    - **Rival truck**: named competitor with a 0–100 momentum stat (`GameState.rivalTruck`) that drifts daily based on the player's prices/reputation (`BusinessLogic.updateRivalTruck`), pulls daily customer count ±12.5% at the extremes, feeds two new feedback contexts (`rivalPressure`/`rivalDominant`), and renders as a color-coded bar + label on the Business tab storefront panel.
    - **Health inspector**: a pre-day gate (`GameController.checkHealthInspectorTrigger`, 2% chance, day ≥ 10, 20-day cooldown) that blocks Next Day with a non-dismissable modal (`UIManager.showHealthInspectorModal`) until the player picks Comply / Bribe / Dispute — each with real cost and reputation tradeoffs (see mechanics section for exact numbers) — then resumes day processing via `resolveHealthInspectorChoice`.
    - **News ticker**: new `GameState.newsFeed` (capped at 20) surfaces both mechanics' outcomes as a "word on the street" feed on the Business tab, populated via `GameData.newsTemplates`/`getNewsLine`.
    - **Verified live in-browser** (Chrome, via `claude-in-chrome`, not just headless): bootstrapped a real game through `SetupManager.beginGame()`, confirmed the storefront rival bar renders correctly in both directions (momentum 80 → "losing ground to", momentum 20 → "ahead of"), confirmed the news ticker renders both entry types newest-first, and drove all three health-inspector choices through the *actual* click handler (not just the underlying method) to confirm the modal hides, `aria-hidden` resets, and day processing resumes correctly. Stress-tested via console: 300 simulated real days with the trigger live produced the expected ~2%/day fire rate (6 fires), zero errors, every day advancing by exactly 1 (no double-advance), and rival momentum correctly crossing the 65 threshold twice to post two "out-hustling" news entries. Separately ran 400+ direct calls across comply/bribe/dispute (including forcing the ~20% bribe-caught and ~40%/60% dispute win/lose branches statistically) with zero thrown errors. One red herring caught and ruled out during testing: the modal initially screenshotted as near-invisible and a day-counter loop appeared to double-advance — both were artifacts of the test harness (a stale-cache page load per the documented caching quirk, and a stale modal-visibility flag in the loop script) rather than real bugs; confirmed by re-checking computed styles and isolating the day-advance logic.
    - Bumped `window.GAME_VERSION` to `0.32.0`.
37. Recipe-panel toggle smoothing (2026-07-09) — fixed a player-reported UX bug: clicking a core ingredient or topping on the Recipe tab snapped the whole page down/up instantly. Root cause: `updateRecipePanel()` swaps `innerHTML` on three stacked containers (`recipeSummary`, `recipeCoreChips`, `recipeAddonChips`), and `recipeSummary` sits *above* the chip sections — its height varies with content that changes on toggle (missing-core "(N cores off)" text, addon price/consumption breakdown length, per-sale consumption line count), so every toggle reflowed everything below it in one frame.
    - **Fix**: new `UIManager.animateHeightChange(el, updateFn)` — a FLIP-style helper that reads the element's height before `updateFn()` runs and after, then CSS-transitions between the two (`height var(--t-normal) ease`, 200ms) instead of snapping. No-ops (just runs `updateFn`) under `prefers-reduced-motion` or when the height didn't actually change. Wired around all three containers inside `updateRecipePanel()`.
    - **Robustness**: a rapid second toggle cancels the still-settling prior animation via a cleanup function stashed on the element (`el._heightAnimCleanup`) instead of letting two `transitionend` listeners race. A 400ms fallback `setTimeout` always runs cleanup even if `transitionend` never fires, so the element can never get permanently stuck clipped at its old height mid-transition.
    - **Why the fallback isn't just defensive paranoia**: verified live via `claude-in-chrome` that the fallback is load-bearing, not theoretical — that tool renders its tab as backgrounded (`document.hidden === true`) even while "focused," which fully suspends `requestAnimationFrame` and CSS transitions per spec. Without the fallback timeout, the transition-only cleanup never ran in that environment and the element stayed permanently clipped at the pre-toggle height. Confirmed the 400ms `setTimeout` fallback still fires under that same suspended-rendering condition (`setTimeout` is throttled but not fully paused when hidden, unlike rAF/transitions) and restores the correct natural height and inline styles. Also confirmed correctness end-to-end with four rapid toggles in a row (bread off/meat off/bread on/meat on) — final conversion % and DOM state matched the expected net recipe change with no leaked listeners or stale styles.
    - No `GAME_VERSION` bump — visual-only polish, not a gameplay change.
