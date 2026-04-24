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

Production is self-hosted on a Raspberry Pi, served at **[foodempiretycoon.com](https://foodempiretycoon.com)**. Since the game is a static SPA (no build step, no backend, all state in `localStorage`), any basic HTTP server works — nginx, Apache, or even `python -m http.server` behind a reverse proxy. Deploys are just a `git pull` on the Pi after pushing to GitHub (`origin/main`).

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
js/game/
  BusinessLogic.js                 Daily sim math — customers, revenue, costs, events,
                                   regulars, recipe consumption
  GameController.js                Event handlers, user actions
js/ui/
  UIManager.js                     All DOM rendering, modal management
  SetupManager.js                  Setup wizard step flow (food → name → location → difficulty)
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
Days 1–7 are hard-capped at 1–6 walk-ups regardless of bonuses. Employee/upgrade/marketing bonuses don't apply. Real-feel grind.

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
- **Addons (toppings)**: `GameData.recipeAddons` — lettuce, tomato, bacon, mushrooms, onions, pickles, sauce, jalapeños. **Not** suppliers — each consumes extra units of its parent category per sale (bacon = +1 meat, lettuce = +1 veg, sauce = +1 dairy) plus a price bonus and conversion bump.

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
- **Cost per sale** — `BusinessLogic.calculatePerSaleIngredientCost()` walks current consumption × base unit × supplier tier × market price, plus $2 packaging/gas.
- **Profit per sale** — sell − cost, colored green/coral with margin %.
- **Break-even price** — `calculateBreakEvenPrice()` = per-sale cost + (daily fixed overhead / expected daily sales). Hint shows "$X above break-even" or "charge $Y more to break even."

All tiles recompute on recipe / tier / market / employee / upgrade / marketing changes via the existing observer dispatch (see `handleStateChange` in `UIManager`).

### Fixed monthly overhead
Food truck: vehicle $450, license $150, permit $50, insurance $200. Restaurant: license $300, permit $100, insurance $400. Chain: license $600, permit $200, insurance $800. Plus rent (location-based, 2.5× restaurant, 4× chain) and employee salaries. Finances panel on Business tab shows every line + break-even.

### Events
7% daily trigger rate, 25-type weighted pool (weather, food critic, equipment breakdown, bad review, staff quit, regular's birthday, tourist photo, etc). Each type has 3–5 message variants. Hard mode extras: 15% ingredient spoilage without fridge, 2% daily employee turnover.

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
  employees: [{ type, salary, hiredDay }, ...],
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

- **Named customer bubbles** in the day modal — 48 random first names, 2–4 bubbles per day, ratio skews to the day's mood.
- **Feedback pools** bucketed by context: `general`, `viral`, `busy`, `slow`, `supplyShortage`, food-type, customer-type, plus:
  - `simpleLovers` / `simpleDetractors` — fires when recipe is just the cores. Some diners love minimalism, others want more toppings. "Can't please everyone."
  - `loadedLovers` / `loadedDetractors` — fires when recipe has 3+ extras beyond cores. Some love the gourmet pileup, others find it overloaded.
- **Fix hints** — `GameData.getFixHint(message)` matches complaint keywords to actionable levers ("wait" → hire cook, "stale" → premium suppliers, etc.). Rendered as 💡 line under negative bubbles. **Hidden on hard mode.**
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

## Common dev tasks

**Add a new food type:**
1. Add to `GameData.foodTypes` with `basePrice`, `coreRecipe`, `defaultRecipe`, `coreNames`, `customerAppeal`
2. Add button in `index.html` setup step 1
3. (Optional) Add food-specific feedback bucket in `GameData.positiveFeedback`/`negativeFeedback`

**Add a new core ingredient / supplier:**
1. Add to `GameData.supplierTypes` with `{ name, icon, basePrice, description, isCore: true }`
2. Add to `GameState.state.inventory`, `marketPrices`, `supplierOrders`, `supplierTiers` defaults
3. Add to starter inventory in `SetupManager.beginGame`
4. Add fix-hint keywords if appropriate in `GameData.getFixHint`
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

## Known quirks

- `autoSave` skips when `setup.businessName` is empty — this is why restart/newGame reset state first (otherwise `beforeunload` rewrites the save on reload).
- Ingredient cost paid at supplier-order time — `calculateDailyCosts` doesn't charge per-sale ingredients. Only $2/sale disposables (gas/packaging).
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
