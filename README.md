# Food Empire Tycoon

A grounded food-truck business sim in your browser. Start with $5,000 and a food truck. Build your way to a million-dollar business. Pure vanilla HTML/CSS/JS — no build step, no dependencies.

## Play it

```bash
python -m http.server 8080
# visit http://localhost:8080
```

Or on Windows, use the batch file:

```bash
D:\homework\projects\run\FoodEmpire_Run.bat
```

## How it plays

### Set up your truck
1. **Pick your food** — Sandwiches ($7), Pizza slice ($5), Tacos ($5), or Burgers ($7). Starter prices reflect the bare-bones default recipe.
2. **Name your business**
3. **Pick a location** — Riverside (tourists), University (students), or Business District (professionals). Different foot traffic, rent, and day-of-week rhythms.
4. **Pick difficulty** — Easy ($7k start, +30% customers, gentler opening week, supportive bubbles even on losing days), Normal ($5k, the grounded sim), or Hard ($3k + daily market price drift + no fix hints)

### Design your recipe
The **Recipe** tab is where you decide what you actually sell. Cores are **per-food** — each dish has its own required set:

| Food      | Cores (required)                      |
|-----------|----------------------------------------|
| Burger    | Bun + Beef Patty + Sliced Cheese       |
| Sandwich  | Sliced Bread + Turkey + Swiss          |
| Taco      | Tortilla + Ground Beef + Cheddar       |
| Pizza     | Dough + Tomato Sauce + Mozzarella      |

Skipping a required core costs **−15% conversion per missing slot** — a burger without cheese isn't a burger. But lettuce isn't core on a burger, so leaving it off is fine.

Under the hood, cores pull from **bulk category stock** (Bread / Vegetables / Meat / Dairy). The Recipe tab shows the menu-facing names (Bun, Beef Patty) with "from Bread stock · 1/sale" subtext.

**Toppings** (lettuce, tomato, bacon, mushrooms, onions, pickles, sauce, jalapeños): opt-in extras. Each consumes extra units of its parent category — bacon = +1 meat per sale, lettuce = +1 veg, sauce = +1 dairy. Every topping bumps the sell price ($0.50–$1.50) and nudges conversion (+1–3%).

**Can't please everyone**: run a bare-bones recipe and some diners will praise the clean simplicity — others will say it's boring and want more toppings. Load it up and some will love the gourmet pile, others will say it's too busy.

**Meal deal** toggle: +$5 per sale, consumes 1 drink + 1 side. Good margin if you stay stocked.

### Stock supplies
The **Suppliers** tab shows a slider per ingredient (1–50 units). Live unit price + total. Bulk discounts kick in at 25+ (−5%) and 50 (−10%). Small orders under 10 get a +10% surcharge.

**Premium tiers** unlock per supplier after day 30 + 10 orders (befriend the vendor). Premium costs 1.8× basic but every premium core ingredient in your recipe adds +3% conversion — stacks up to +12%.

**Hard mode:** prices drift ±15% daily with occasional ±30% shocks. Watch for ▲/▼ arrows.

### Run the business
Click **Next Day** on the Business tab. A modal pops up with:
- A one-sentence **narrative** summary of the day
- **Snapshot tiles** — cash, reputation, regulars, employees, followers
- **The day's books** — a small income statement: sales minus each operating cost = operating result, then other cash in/out (supplies bought, hires, upgrades, bonuses, tips), ending in **change in cash** — which always matches how far your Cash moved
- **Events** — weather, food critics, equipment breakdowns, regulars' birthdays, staff quitting (25 types, 3–5 variants each)
- **Named customer comments** as chat bubbles — up to 4 voices per day, capped at actual walkup count (a 1-customer day = at most 1 bubble)
- **💡 Fix hints** under each complaint pointing at the game lever that addresses it (hidden on Hard). Once you pull a lever — buy the Sound System, hire a Cashier, turn on Meal mode — the complaints that pointed there stop appearing too, not just the hint.

Past days live in a **journal list** on the Business tab. Click any entry to browse history with prev/next navigation.

### Adjust price (with live economics)
Business tab's **Menu pricing** card is four live tiles, all recomputed the moment you change a recipe, supplier tier, or price:

- **Sell price** — exactly what customers pay, including the kitchen-staff premium and seating. +/− buttons, clamped 50–150% of base. Demand is a real curve: every +10% on price loses about 8% of buyers, so there's a profit-maximizing price rather than "always charge the max."
- **Cost per sale** — ingredients (consumption × base × tier × market) + $0.40 packaging.
- **Profit per sale** — sell minus cost, with margin %. Green when you're making money, coral when you're bleeding.
- **Break-even price** — the minimum you can charge and still cover fixed overhead at today's sales pace. Hint says "$2.60 above break-even" or "charge $0.40 more to break even."

### Watch your costs
The **Monthly overhead** card on the Business tab shows every line:
- Rent (by location)
- Vehicle payment (food truck only), business license, food permit, insurance
- Employee salaries
- Social media ads (if running)

Amounts include the difficulty's cost multiplier (Easy 0.85×, Hard 1.2×) and trained staff's higher salaries. Break-even = fixed costs ÷ profit per sale (price minus the cost of making it), shown as sales per month and per day.

## Progression

1. **Food Truck** — where you start. $160/mo vehicle payment, 30-regular cap.
2. **Restaurant** ($40,000 cash) — bigger capacity, higher rent, truck payment gone. Unlocks chef/server/manager employees. Real commitment — expect ~7 months of steady play.
3. **Chain** ($120,000 cash, restaurant required) — second location. Biggest customer base.
4. **Win** — $1,000,000 cash.

Milestones at $100k / $500k / $1M / $5M unlock achievement rewards. The Business Progression card sits at the bottom of the Upgrades tab since it's the big-ticket buy — equipment comes first.

## Opening week is hard (unless you pick Easy)

Days 1–7 are capped at 1–6 walk-ups on Normal and Hard regardless of bonuses — real food trucks grind through their first week. After day 7, employees/upgrades/marketing start helping, and **regulars** begin building (cap 30 on a truck).

**Easy mode** gets a cushioned opening: base 3–6 walkups, cap 12, gentler day curve, and the +30% customer multiplier already applies during week 1. You'll still post a small loss from fixed overhead some days, but it reads playable, not punishing.

## Classroom mode

For teachers using the game in an economics or business class. Open **[foodempiretycoon.com/?classroom](https://foodempiretycoon.com/?classroom)** once on each computer, or click the **🎓 Classroom** button in the game's button row and confirm. While it's on:

- No achievement rewards, no $500 tutorial bonus, no customer tips. Achievements still unlock as badges.
- Real costs still apply: surprise expenses, repairs, comps, inspector fines, and everything the player buys.
- So cash moves only with sales and real costs, which keeps student graphs and hand calculations clean.

It works on existing saves from the next day on (no restart), and is saved per browser. It is **one-way**: once on, it can't be turned off in that browser (for any game, including new ones), so students can't switch bonuses back on mid-exercise. The button shows a confirm dialog that says so before it locks in. Bonuses earned before it was turned on stay listed under "Other cash (not from sales)" in those days' reports.

The Business tab shows **Visitors yesterday** (everyone who walked up) and **Customers yesterday** (only those who bought), so a formula like *(customers × profit per sale) − daily overhead* uses the right count.

## Save / load

Auto-saves on tab switch and page close. Manual save/load buttons on the Business tab. Everything stored in `localStorage`. **Start Over** wipes the save.

Saves carry across updates: each save has a version, and older saves are upgraded when they load (nothing earned is reset). The Resume dialog lists what changed since the player's last visit.

## Tech

- Vanilla HTML, CSS, JavaScript — no frameworks, no build
- Observer pattern on game state drives UI updates
- Retro look: `Press Start 2P` logo, `Pixelify Sans` headings/buttons, `Space Grotesk` body, subtle CRT scanline overlay over a deep-navy palette
- Mobile-friendly layout (single column below 1024px) — desktop-first
- Procedural sound effects via the Web Audio API — no audio asset files, mute toggle persists across sessions
- `1`–`6` keyboard shortcuts jump straight to a tab; `n` advances the day

## Hosting

Self-hosted on a Raspberry Pi, served at [foodempiretycoon.com](https://foodempiretycoon.com). Public traffic arrives through a Cloudflare Tunnel — no port forwarding, no static IP needed — terminating at nginx, which serves the static files directly. Because the game is a single-page static site (`index.html` + `css/` + `js/`), it runs happily off any basic HTTP server. No build step, no backend, no database — all state lives in the player's `localStorage`.

## Discoverability

The repo includes `llms.txt`, `robots.txt`, `sitemap.xml`, and a full SEO / Open Graph / JSON-LD `<head>` block in `index.html` so AI chatbots and search engines can describe this game clearly when someone searches for "food truck simulator" or "games about starting a food truck."

## File structure

```
index.html                      Markup
css/styles.css                  Full design system
js/main.js                      Bootstrap
js/modules/GameData.js          Foods, employees, events, costs, recipe addons
js/modules/GameState.js         Observable state
js/modules/TutorialManager.js   Tutorial coach
js/modules/SoundManager.js      Procedural sound effects
js/game/BusinessLogic.js        Daily sim math
js/game/GameController.js       User actions
js/ui/UIManager.js              Rendering
js/ui/SetupManager.js           Setup wizard
```

## Current state

**Now live at [foodempiretycoon.com](https://foodempiretycoon.com)** — self-hosted on a Raspberry Pi, source on [GitHub](https://github.com/carsonxdd/foodempiretycoon).

Feature-complete for the core loop. Recent additions:
- **One-way classroom mode (0.34.1)** — turning it on now shows a confirm dialog explaining what changes, and it can't be turned off afterward (`?classroom=off` no longer works).
- **Classroom mode (0.34.0)** — a `?classroom` link or 🎓 button turns off achievement, tutorial and tip cash for classroom use, on existing saves too. The status card now separates visitors from customers (buyers).
- **Milestone fix (0.33.1)** — starting a new game now always clears old milestone flags, so a player whose save was wiped by an older version's Restart still earns this run's milestone bonuses.
- **Visual refresh, bug sweep + rebalance (0.33.0)** — readable type (Space Grotesk body, Pixelify Sans headings, Press Start 2P logo), slim in-game header, big Next Day button, phone layout fixed (it scrolled sideways). Day reports became an income statement that reconciles to cash. Fixed: phantom $500 bonus for the starting crew on day 1, double payroll on new hires and ads, chains unable to hire, food/location appeal never applied, chef price premium ignored, wrong break-even formula, displayed prices/costs not matching the sim, "Customers yesterday" stuck at 0, toppings' categories flagged "Not in recipe." Rebalanced the runaway reputation loop, gave price a real demand curve, and raised tacos/pizza to $5 so every food is viable (0 bankruptcies across all foods × difficulties × locations in simulation).
- **In-game feedback is live** — the 💬 button posts to a Cloudflare Worker at `feedback.foodempiretycoon.com` that forwards to Discord (origin allowlist, honeypot, no @mentions, no IPs).
- **Favicon** — a simple burger-icon SVG (`favicon.svg`) matching the site palette, so the browser tab and bookmarks aren't blank
- **Smoother recipe toggles** — clicking a core ingredient or topping now animates the summary panel and chip grids to their new height instead of snapping instantly, so the Recipe tab no longer jolts the rest of the page down when its content grows or shrinks.
- **Rival truck + health inspector** — a named competitor with a momentum stat that drifts based on your prices/reputation, tugs your daily customer count, and shows up as a bar on the storefront panel; plus a rare (2%, day 10+) pre-day health-inspector event with a real branching choice (comply / bribe / dispute). Both feed a new "word on the street" news ticker on the Business tab.
- **Immersion & smoothness pass** — tab hotkeys (`1`–`6`), a flavor line on the Resume modal, a screen-flash + confetti burst on big milestones, procedural sound effects with a 🔊/🔇 toggle, a rain/sun/cold/heat tint on the day-recap modal keyed to that day's weather event, and a live storefront panel (business icon, reputation-tier crowd size, owned upgrades, weather) on the Business tab
- **QA bug sweep** — fixed 5 issues found in a full Chrome-driven test pass: setup-wizard validation errors now use the toast system instead of a blocking `alert()`, the day-recap narrative's weekday now matches the modal header, the header money display no longer shows raw floating-point decimals, the employee "Train" button label no longer overlaps itself, and a fast double-click on the food-selection step can no longer silently swap your pick.
- **Hints don't repeat** — buying the Sound System (or hiring a Cashier, turning on Meal mode, etc.) silences both the 💡 hint *and* the complaints that pointed there. Pulled-lever check is structured per rule, so once you've addressed a problem the chat moves on to fresh feedback.
- **Easy mode rebalance** — +30% customers, opening-week cushion (base 3–6 walkups, cap 12, gentler ramp), bad-day bubble split flipped to 2 positive / 1 negative with cheerleader-first trimming, and a softer reputation penalty on losing days. The simulation stays honest about money, but the experience reads supportive instead of punishing.
- **Public release** — pushed to GitHub, hosted on a Pi at the production domain, with `llms.txt` + `robots.txt` + `sitemap.xml` + full SEO/Open Graph/JSON-LD `<head>` so AI chatbots and search engines describe the game when users search for food truck or restaurant simulators
- **Alive landing page** — amber-glow title pulse, rolling customer-quote ticker pulling from the real feedback pool, ambient floating food emojis drifting behind the content, and punchier copy ("Your food. Your grind. Your rules.")
- **Deferred save prompt** — no dialog at page load; clicking Start Your Empire surfaces a styled Resume / Start Fresh modal only when there's a saved game
- Per-food core recipes (burger = bun+beef+cheese, pizza = dough+sauce+mozz, etc.) with menu-facing display names
- "Can't please everyone" feedback when recipes are too simple or too loaded
- Lettuce + tomato addons, Dairy category (rolls up cheese + sauce bases)
- 4-tile live economics on Menu pricing — sell / cost / profit / break-even, all live
- Restaurant upgrade cost tuned to $40k (chain $120k) based on cash-accumulation modeling — earned, not a slog
- Recipe builder with toppings, premium supplier tiers, daily modal + journal history, actionable complaint hints, market price drift on hard mode

See [CLAUDE.md](./CLAUDE.md) for architecture, state shape, and how to extend (add a new food, topping, event, cost line).

Locally, hard-refresh (Ctrl+Shift+R) after code changes. For production, bump the `?v=` on the asset tags in `index.html` with every JS/CSS change — JS/CSS are cached for 7 days, HTML isn't (details in CLAUDE.md → Hosting).

## Next ideas (if/when you come back)

- Business analytics dashboard — weekly/monthly trends from the journal
- Custom employee names + relationships (like regulars)
- Seasonal events (summer slow-down, holiday rushes)
- Late-game pacing — restaurant → chain → $1M takes ~1,000 days even with strong play
- Wire up the flavor-only staff perks (server tips, manager efficiency)
- Expandable menu: run 2+ food types simultaneously
- Fractional addon consumption (bacon = 1.5 meats if you want that math)
