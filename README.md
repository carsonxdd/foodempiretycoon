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
1. **Pick your food** — Sandwiches ($7), Pizza slice ($4.50), Tacos ($3.50), or Burgers ($7). Starter prices reflect the bare-bones default recipe.
2. **Name your business**
3. **Pick a location** — Riverside (tourists), University (students), or Business District (professionals). Different foot traffic, rent, and day-of-week rhythms.
4. **Pick difficulty** — Easy ($7k start, softer numbers), Normal ($5k), or Hard ($3k + daily market price drift + no fix hints)

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
- **Collapsible numbers** — full revenue/cost breakdown
- **Events** — weather, food critics, equipment breakdowns, regulars' birthdays, staff quitting (25 types, 3–5 variants each)
- **Named customer comments** as chat bubbles — 2–4 voices per day
- **💡 Fix hints** under each complaint pointing at the game lever that addresses it (hidden on Hard)

Past days live in a **journal list** on the Business tab. Click any entry to browse history with prev/next navigation.

### Adjust price (with live economics)
Business tab's **Menu pricing** card is four live tiles, all recomputed the moment you change a recipe, supplier tier, or price:

- **Sell price** — +/− buttons, clamped 50–150% of base. Cheaper = more buyers, pricier = fewer.
- **Cost per sale** — ingredients (consumption × base × tier × market) + $2 packaging.
- **Profit per sale** — sell minus cost, with margin %. Green when you're making money, coral when you're bleeding.
- **Break-even price** — the minimum you can charge and still cover fixed overhead at today's sales pace. Hint says "$2.60 above break-even" or "charge $0.40 more to break even."

### Watch your costs
The **Monthly overhead** card on the Business tab shows every line:
- Rent (by location)
- Vehicle payment (food truck only), business license, food permit, insurance
- Employee salaries
- Social media ads (if running)

Break-even calc tells you how many sales per month you need to cover fixed costs.

## Progression

1. **Food Truck** — where you start. $450/mo vehicle payment, 30-regular cap.
2. **Restaurant** ($40,000 cash) — bigger capacity, higher rent, truck payment gone. Unlocks chef/server/manager employees. Real commitment — expect ~7 months of steady play.
3. **Chain** ($120,000 cash, restaurant required) — second location. Biggest customer base.
4. **Win** — $1,000,000 cash.

Milestones at $100k / $500k / $1M / $5M unlock achievement rewards. The Business Progression card sits at the bottom of the Upgrades tab since it's the big-ticket buy — equipment comes first.

## Opening week is hard

Days 1–7 are capped at 1–6 walk-ups regardless of bonuses. Real food trucks grind through their first week. After day 7, employees/upgrades/marketing start helping, and **regulars** begin building (cap 30 on a truck).

## Save / load

Auto-saves on tab switch and page close. Manual save/load buttons on the Business tab. Everything stored in `localStorage`. **Start Over** wipes the save.

## Tech

- Vanilla HTML, CSS, JavaScript — no frameworks, no build
- Observer pattern on game state drives UI updates
- Retro look: `Press Start 2P` headings, `VT323` body, subtle CRT scanline overlay over a deep-navy palette
- Mobile-friendly layout (single column below 1024px) — desktop-first

## Hosting

Self-hosted on a Raspberry Pi, served at [foodempiretycoon.com](https://foodempiretycoon.com). Because the game is a single-page static site (`index.html` + `css/` + `js/`), it runs happily off any basic HTTP server — nginx, Apache, or even `python -m http.server` behind a reverse proxy. No build step, no backend, no database — all state lives in the player's `localStorage`.

## File structure

```
index.html                      Markup
css/styles.css                  Full design system
js/main.js                      Bootstrap
js/modules/GameData.js          Foods, employees, events, costs, recipe addons
js/modules/GameState.js         Observable state
js/modules/TutorialManager.js   Tutorial coach
js/game/BusinessLogic.js        Daily sim math
js/game/GameController.js       User actions
js/ui/UIManager.js              Rendering
js/ui/SetupManager.js           Setup wizard
```

## Current state

Feature-complete for the core loop. Recent additions:
- **Alive landing page** — amber-glow title pulse, rolling customer-quote ticker pulling from the real feedback pool, ambient floating food emojis drifting behind the content, and punchier copy ("Your food. Your grind. Your rules.")
- **Deferred save prompt** — no dialog at page load; clicking Start Your Empire surfaces a styled Resume / Start Fresh modal only when there's a saved game
- Per-food core recipes (burger = bun+beef+cheese, pizza = dough+sauce+mozz, etc.) with menu-facing display names
- "Can't please everyone" feedback when recipes are too simple or too loaded
- Lettuce + tomato addons, Dairy category (rolls up cheese + sauce bases)
- 4-tile live economics on Menu pricing — sell / cost / profit / break-even, all live
- Restaurant upgrade cost tuned to $40k (chain $120k) based on cash-accumulation modeling — earned, not a slog
- Recipe builder with toppings, premium supplier tiers, daily modal + journal history, actionable complaint hints, market price drift on hard mode

See [CLAUDE.md](./CLAUDE.md) for architecture, state shape, and how to extend (add a new food, topping, event, cost line).

Hard-refresh the browser (Ctrl+Shift+R) after code changes to bypass cache.

## Next ideas (if/when you come back)

- Business analytics dashboard — weekly/monthly trends from the journal
- Custom employee names + relationships (like regulars)
- Seasonal events (summer slow-down, holiday rushes)
- Competitor trucks siphoning customers
- Expandable menu: run 2+ food types simultaneously
- Fractional addon consumption (bacon = 1.5 meats if you want that math)
