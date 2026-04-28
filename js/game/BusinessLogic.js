/**
 * BusinessLogic Module - Core business simulation calculations
 */
class BusinessLogic {
    constructor(gameState) {
        this.gameState = gameState;
        // Track last-shown messages so we don't repeat back-to-back.
        this.lastFeedback = { positive: '', negative: '' };
        this.lastEventMessage = {};
    }

    // Calculate daily customer flow
    calculateDailyCustomers(eventModifiers = { customerMultiplier: 1.0 }) {
        const setup = this.gameState.setup;
        const location = setup.location;
        const difficulty = GameData.getDifficultySettings(setup.difficulty);
        const businessType = this.gameState.business.type;
        const day = this.gameState.day;
        const openingWeek = GameData.progression.openingWeekDays;

        // Opening week: real food trucks get 2-5 a day at best.
        // Day 1 is the quietest; numbers drift up slowly through the week.
        if (day <= openingWeek) {
            const dayCurve = 0.6 + (day / openingWeek) * 0.4; // 0.7 on day 1, 1.0 on day 7
            const base = 1 + Math.floor(Math.random() * 3); // 1-3
            const locationBump = (location?.modifiers?.customerBase || 1.0) * 0.15;
            const opening = Math.max(1, Math.floor(base * (1 + locationBump) * dayCurve));
            return Math.min(6, Math.floor(opening * eventModifiers.customerMultiplier));
        }

        // Past opening week: normal formula + regulars layer.
        let baseCustomers = 8 + Math.floor(Math.random() * 14);
        baseCustomers *= (location?.modifiers?.customerBase || 1.0);
        baseCustomers *= difficulty.customerMultiplier;

        if (businessType === 'restaurant') baseCustomers *= 1.8;
        else if (businessType === 'chain') baseCustomers *= 3.0;

        // Employee bonus — diminishing returns
        const empCount = this.gameState.employees.length;
        const employeeBonus = empCount > 0 ? Math.floor(Math.pow(empCount, 0.7) * 3) : 0;

        // Reputation now accumulates slower → bonus kicks in slower too.
        const reputationBonus = Math.floor(this.gameState.reputation / 50);

        // Marketing
        let marketingBonus = 0;
        if (this.gameState.marketing.hasCameraSetup) {
            marketingBonus = Math.floor(this.gameState.marketing.followers / 150);
        }
        if (this.gameState.marketing.hasSocialMediaAds) {
            marketingBonus += 5;
        }

        // Upgrades
        let upgradeBonus = 0;
        if (this.gameState.upgrades.seating) upgradeBonus += 6;
        if (this.gameState.upgrades.soundSystem) upgradeBonus += 3;

        const dayModifier = this.getDayOfWeekModifier();

        // Regulars layer: most of your built-up regulars show up.
        const regularsToday = Math.floor(this.gameState.regulars * (0.7 + Math.random() * 0.3));

        const walkUps = Math.floor(
            (baseCustomers + employeeBonus + reputationBonus + marketingBonus + upgradeBonus)
            * dayModifier
            * eventModifiers.customerMultiplier
        );

        return Math.max(1, walkUps + regularsToday);
    }

    // Calculate daily revenue
    calculateDailyRevenue(customers) {
        const setup = this.gameState.setup;
        const foodData = GameData.getFoodTypeData(setup.foodType);
        const difficulty = GameData.getDifficultySettings(setup.difficulty);

        if (!foodData) return 0;

        // Start with the food's base price.
        let basePrice = foodData.basePrice;

        // Meal mode adds the meal bonus (drink + side bundled in).
        if (setup.mealMode) {
            basePrice += GameData.mealBonus;
        }

        // Addon price bonuses — each topping in the recipe adds to the sell price.
        const recipeForPrice = setup.recipe || [];
        recipeForPrice.forEach(ing => {
            const addon = GameData.getAddon(ing);
            if (addon?.priceBonus) basePrice += addon.priceBonus;
        });

        // Apply player's price adjustment (0.5x to 1.5x).
        const priceMult = setup.priceMultiplier || 1.0;
        basePrice *= priceMult;

        // Employee price modifiers
        const cooks = this.gameState.employees.filter(emp => emp.type === 'cook');
        if (cooks.length > 0) {
            const cookData = GameData.getEmployeeType('cook');
            basePrice *= (cookData.benefits.priceMultiplier || 1.0);
        }

        // Upgrade modifiers
        if (this.gameState.upgrades.seating) {
            const seatingData = GameData.getUpgradeType('seating');
            basePrice *= (seatingData.benefits.averageSpend || 1.0);
        }

        // Customer conversion rate (not all lookers buy)
        const conversionRate = this.calculateConversionRate();
        const potentialSales = Math.floor(customers * conversionRate);

        // Inventory constraint: consumption is aggregated by parent category.
        // Example: burger with bacon + onions → 1 bread, 2 veg, 2 meat, 1 cheese per sale.
        const consumption = GameData.computeRecipeConsumption(setup);
        const inv = this.gameState.inventory;
        const cats = Object.keys(consumption);
        const inventoryCap = cats.length > 0
            ? Math.min(...cats.map(k => Math.floor((inv[k] || 0) / consumption[k])))
            : 0;
        const actualSales = Math.max(0, Math.min(potentialSales, inventoryCap));
        const lostSales = potentialSales - actualSales;

        if (actualSales > 0) {
            cats.forEach(k => {
                this.gameState.useInventory(k, actualSales * consumption[k]);
            });
        }

        const revenue = actualSales * basePrice;

        return {
            totalCustomers: customers,
            actualSales: actualSales,
            potentialSales: potentialSales,
            lostSales: lostSales,
            pricePerSale: basePrice,
            totalRevenue: revenue,
            conversionRate: conversionRate
        };
    }

    // Calculate daily costs.
    // Raw ingredient cost is paid at supplier-order time, not per sale.
    calculateDailyCosts(actualSales, eventModifiers = { costMultiplier: 1.0 }) {
        const difficulty = GameData.getDifficultySettings(this.gameState.setup.difficulty);
        const businessType = this.gameState.business.type;

        // Employee costs (monthly salary / 30 days)
        const employeeCosts = this.gameState.employees.reduce((total, emp) => {
            const empData = GameData.getEmployeeType(emp.type);
            return total + (empData ? empData.salary / 30 : 0);
        }, 0);

        // Location rent
        const location = this.gameState.setup.location;
        let baseRent = location?.modifiers?.rentCost || 500;
        if (businessType === 'restaurant') baseRent *= 2.5;
        else if (businessType === 'chain') baseRent *= 4;
        const rentCost = baseRent / 30;

        // Fixed monthly overhead — vehicle, license, permit, insurance.
        const fixed = GameData.getFixedCosts(businessType);
        const vehicleCost   = fixed.vehiclePayment  / 30;
        const licenseCost   = fixed.businessLicense / 30;
        const permitCost    = fixed.foodPermit      / 30;
        const insuranceCost = fixed.insurance       / 30;

        // Disposables/packaging/gas per sale
        let disposablesCost = actualSales * 2;
        disposablesCost *= eventModifiers.costMultiplier;

        // Recurring marketing
        let marketingCosts = 0;
        if (this.gameState.marketing.hasSocialMediaAds) {
            marketingCosts += GameData.marketingOptions.socialMediaAds.cost / 30;
        }

        const baseTotal = employeeCosts + rentCost + disposablesCost + marketingCosts
            + vehicleCost + licenseCost + permitCost + insuranceCost;
        const totalCosts = baseTotal * difficulty.costMultiplier;
        const mult = difficulty.costMultiplier;

        return {
            employeeCosts:  employeeCosts  * mult,
            rentCost:       rentCost       * mult,
            ingredientCosts: disposablesCost * mult,
            marketingCosts: marketingCosts * mult,
            vehicleCost:    vehicleCost    * mult,
            licenseCost:    licenseCost    * mult,
            permitCost:     permitCost     * mult,
            insuranceCost:  insuranceCost  * mult,
            totalCosts:     totalCosts
        };
    }

    // Calculate customer conversion rate
    calculateConversionRate() {
        let baseRate = 0.7; // 70% of people who look actually buy

        // Price sensitivity: 1.0x = neutral, 0.5x = +30%, 1.5x = -30%.
        const priceMult = this.gameState.setup.priceMultiplier || 1.0;
        baseRate -= (priceMult - 1.0) * 0.6;

        // Recipe penalty: each missing *per-food* core ingredient scares off buyers (-15%).
        // A burger without lettuce is fine — lettuce isn't core for a burger.
        // A burger without a patty is a disaster.
        const recipe = this.gameState.setup.recipe || [];
        const foodType = this.gameState.setup.foodType;
        const coreIngredients = GameData.getCoreRecipe(foodType);
        const missingCore = coreIngredients.filter(ing => !recipe.includes(ing));
        baseRate -= missingCore.length * 0.15;

        // Premium bonus: each premium core ingredient currently used adds conversion.
        const tiers = this.gameState.setup.supplierTiers || {};
        const premiumCoreUsed = coreIngredients
            .filter(ing => recipe.includes(ing) && tiers[ing] === 'premium')
            .length;
        baseRate += premiumCoreUsed * GameData.premium.conversionBonusPerIngredient;

        // Addon conversion bonus — toppings make the food more appealing.
        recipe.forEach(ing => {
            const addon = GameData.getAddon(ing);
            if (addon?.appealBonus) baseRate += addon.appealBonus;
        });

        // Employee improvements
        const cashiers = this.gameState.employees.filter(emp => emp.type === 'cashier');
        const cooks = this.gameState.employees.filter(emp => emp.type === 'cook');

        // Each employee type improves conversion, but with diminishing returns.
        if (cashiers.length > 0) baseRate += 0.15;
        if (cooks.length > 0) baseRate += 0.1 * Math.sqrt(cooks.length);

        // Upgrade improvements
        if (this.gameState.upgrades.kitchenEquipment) {
            baseRate += 0.1;
        }
        if (this.gameState.upgrades.seating) {
            baseRate += 0.05;
        }

        // Reputation effect
        const reputationBonus = Math.min(0.2, this.gameState.reputation / 1000);
        baseRate += reputationBonus;

        return Math.min(0.95, baseRate); // Cap at 95%
    }

    // --- Live economics helpers (used by the pricing panel) -----------------

    // What each sale costs in ingredients, using the *current* recipe,
    // supplier tier per ingredient, and live market prices. Plus $2/sale for
    // disposables/packaging/gas (matches calculateDailyCosts).
    calculatePerSaleIngredientCost() {
        const setup = this.gameState.setup;
        const consumption = GameData.computeRecipeConsumption(setup);
        const tiers = setup.supplierTiers || {};
        const market = this.gameState.marketPrices || {};
        let cost = 0;
        Object.entries(consumption).forEach(([k, units]) => {
            const supplier = GameData.supplierTypes[k];
            if (!supplier) return;
            const tierMult = tiers[k] === 'premium' ? GameData.premium.multiplier : 1.0;
            const marketMult = market[k] || 1.0;
            // basePrice is for a 10-unit order — unit cost is basePrice/10.
            const unitCost = (supplier.basePrice / 10) * tierMult * marketMult;
            cost += units * unitCost;
        });
        return cost + 2; // disposables/packaging/gas
    }

    // Rough daily-sales projection used for break-even allocation. Assumes a
    // "normal" day (no hard-cap, no event modifier), so it's stable for UI.
    estimateExpectedDailySales() {
        const setup = this.gameState.setup;
        const location = setup.location;
        const difficulty = GameData.getDifficultySettings(setup.difficulty);
        const businessType = this.gameState.business.type;
        const day = this.gameState.day;
        const openingWeek = GameData.progression.openingWeekDays;

        // Opening week: conservative midpoint of the cap band.
        if (day <= openingWeek) {
            const conv = this.calculateConversionRate();
            return Math.max(1, Math.round(3 * conv));
        }

        // Past opening week: mean of 8-21 walk-ups + location/difficulty/business scaling.
        let walkUps = 14;
        walkUps *= (location?.modifiers?.customerBase || 1.0);
        walkUps *= difficulty.customerMultiplier;
        if (businessType === 'restaurant') walkUps *= 1.8;
        else if (businessType === 'chain') walkUps *= 3.0;

        // Employee / marketing / upgrade bonuses (match calculateDailyCustomers).
        const empCount = this.gameState.employees.length;
        const employeeBonus = empCount > 0 ? Math.pow(empCount, 0.7) * 3 : 0;
        const reputationBonus = this.gameState.reputation / 50;
        let marketingBonus = 0;
        if (this.gameState.marketing.hasCameraSetup) {
            marketingBonus = this.gameState.marketing.followers / 150;
        }
        if (this.gameState.marketing.hasSocialMediaAds) marketingBonus += 5;
        let upgradeBonus = 0;
        if (this.gameState.upgrades.seating) upgradeBonus += 6;
        if (this.gameState.upgrades.soundSystem) upgradeBonus += 3;

        const customers = walkUps + employeeBonus + reputationBonus + marketingBonus + upgradeBonus
            + this.gameState.regulars * 0.85;
        const conv = this.calculateConversionRate();
        return Math.max(1, Math.round(customers * conv));
    }

    // Sum of monthly fixed overhead (no ingredients, no per-sale), in $/day.
    calculateDailyFixedCosts() {
        const businessType = this.gameState.business.type;
        const location = this.gameState.setup.location;
        const fixed = GameData.getFixedCosts(businessType);

        let rent = location?.modifiers?.rentCost || 500;
        if (businessType === 'restaurant') rent *= 2.5;
        else if (businessType === 'chain') rent *= 4;

        const employeeMonthly = this.gameState.employees.reduce((sum, e) => {
            const data = GameData.getEmployeeType(e.type);
            return sum + (data?.salary || 0);
        }, 0);

        const marketing = this.gameState.marketing.hasSocialMediaAds
            ? GameData.marketingOptions.socialMediaAds.cost : 0;

        const monthly = rent + fixed.vehiclePayment + fixed.businessLicense
            + fixed.foodPermit + fixed.insurance + employeeMonthly + marketing;
        return monthly / 30;
    }

    // Minimum price that covers per-sale cost AND a fair share of fixed costs
    // at the current expected daily sales. This is "what you should charge to
    // break even at a typical day's volume."
    calculateBreakEvenPrice() {
        const perSale = this.calculatePerSaleIngredientCost();
        const fixedDaily = this.calculateDailyFixedCosts();
        const expectedSales = this.estimateExpectedDailySales();
        const fixedAllocation = expectedSales > 0 ? fixedDaily / expectedSales : 0;
        return perSale + fixedAllocation;
    }

    // Get day of week modifier for customer flow
    getDayOfWeekModifier() {
        const location = this.gameState.setup.location;
        if (!location) return 1.0;

        // Simplified day-of-week calculation based on game day
        const dayOfWeek = this.gameState.day % 7;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (location.type === 'business' && !isWeekend) {
            return location.modifiers.weekdayBonus || 1.0;
        } else if (location.type === 'college' && isWeekend) {
            return location.modifiers.weekendBonus || 1.0;
        } else if (location.type === 'tourist') {
            // Seasonal variation (simplified)
            const seasonModifier = 0.8 + (Math.sin((this.gameState.day / 90) * Math.PI) * 0.4);
            return seasonModifier;
        }

        return 1.0;
    }

    // Process a full day of business
    processDailyBusiness() {
        // Hard-mode passive turnover: 2% chance per day someone quits on their own.
        if (this.gameState.setup.difficulty === 'hard'
            && this.gameState.employees.length > 0
            && Math.random() < 0.02) {
            const idx = Math.floor(Math.random() * this.gameState.employees.length);
            this.gameState.removeEmployee(idx);
        }

        // Hard-mode market prices drift daily (±15%).
        if (this.gameState.setup.difficulty === 'hard') {
            this.refreshMarketPrices();
        }

        // Generate random events FIRST so they can affect calculations
        const events = this.generateRandomEvents();

        // Check for event modifiers
        const eventModifiers = this.getEventModifiers(events);

        const customers = this.calculateDailyCustomers(eventModifiers);
        const revenue = this.calculateDailyRevenue(customers);
        const costs = this.calculateDailyCosts(revenue.actualSales, eventModifiers);

        // Calculate net profit
        const netProfit = revenue.totalRevenue - costs.totalCosts;

        // Update game state
        this.gameState.addMoney(netProfit);

        // Reputation changes based on performance
        const reputationChange = this.calculateReputationChange(revenue, costs);
        this.gameState.addReputation(reputationChange);

        // Marketing growth
        this.processMarketingGrowth(revenue.actualSales);

        // Regulars: start building after opening week, grow on good days,
        // shed on bad ones. Capped by business type.
        this.processRegulars(events, netProfit, revenue.lostSales);

        // Advance day
        this.gameState.nextDay();

        // Build feedback context from the actual day's state.
        const locationTypeToCustomer = {
            college: 'students',
            tourist: 'tourists',
            business: 'professionals',
        };
        // Recipe shape: "simple" if just the cores, "loaded" if 3+ beyond cores.
        // Drives the you-can't-please-everyone feedback split.
        const recipe = this.gameState.setup.recipe || [];
        const cores = GameData.getCoreRecipe(this.gameState.setup.foodType);
        const coresPresent = cores.filter(c => recipe.includes(c)).length === cores.length;
        const extras = Math.max(0, recipe.length - cores.length);
        const feedbackContext = {
            viral: this.gameState.marketing.lastViralBonus > 0,
            busy: customers > 25,
            slow: customers < 6,
            supplyShortage: events.some(e => e.type === 'supply_shortage'),
            foodType: this.gameState.setup.foodType,
            customerType: locationTypeToCustomer[this.gameState.setup.location?.type],
            simple: coresPresent && extras === 0,
            loaded: extras >= 3,
        };

        const feedback = this.generateFeedbackBubbles(feedbackContext, netProfit, events, customers);
        const narrative = this.generateNarrative(customers, revenue, netProfit, events);

        const result = {
            customers,
            revenue,
            costs,
            netProfit,
            reputationChange,
            events,
            feedback,
            narrative,
        };

        // Persist a snapshot so the player can revisit any day later.
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const closingDay = this.gameState.day - 1;
        this.gameState.addHistoryEntry({
            day: closingDay,
            dayName: weekDays[closingDay % 7],
            ...result,
            snapshot: {
                money: Math.round(this.gameState.money),
                reputation: this.gameState.reputation,
                regulars: Math.floor(this.gameState.regulars),
                businessType: this.gameState.business.type,
                employeeCount: this.gameState.employees.length,
                followers: this.gameState.marketing.followers,
            },
        });

        return result;
    }

    // Pick 2-4 feedback bubbles for the day. Ratio skews to the day's mood.
    // Capped at `customers` so a 1-walkup day doesn't produce 3 named quotes.
    generateFeedbackBubbles(context, netProfit, events, customers) {
        if (!customers || customers <= 0) return [];

        const hadBadEvent = events.some(e =>
            e.type === 'bad_review' || e.type === 'health_scare' || e.type === 'equipment_breakdown');

        let positiveCount, negativeCount;
        if (hadBadEvent || netProfit < 0) {
            positiveCount = 1;
            negativeCount = 2;
        } else if (context.viral || netProfit > 100) {
            positiveCount = 3;
            negativeCount = 1;
        } else {
            positiveCount = 2;
            negativeCount = 1;
        }

        // Trim total to actual walkups, dropping negatives first on good days
        // and positives first on bad days so the surviving bubbles still match the mood.
        const trimNegativesFirst = !(hadBadEvent || netProfit < 0);
        while (positiveCount + negativeCount > customers) {
            if (trimNegativesFirst && negativeCount > 0) negativeCount--;
            else if (!trimNegativesFirst && positiveCount > 0) positiveCount--;
            else if (negativeCount > 0) negativeCount--;
            else positiveCount--;
        }

        const bubbles = [];
        const usedMessages = new Set();
        const usedNames = [];

        const pushBubble = (positive) => {
            // Pull a message that wasn't used today
            let attempts = 0;
            let message;
            do {
                message = GameData.getContextualFeedback(positive, context,
                    bubbles[bubbles.length - 1]?.message || '');
                attempts++;
            } while (usedMessages.has(message) && attempts < 8);
            usedMessages.add(message);

            const name = GameData.getRandomName(usedNames);
            usedNames.push(name);

            bubbles.push({ name, positive, message });
        };

        for (let i = 0; i < positiveCount; i++) pushBubble(true);
        for (let i = 0; i < negativeCount; i++) pushBubble(false);

        // Shuffle so positives and negatives interleave
        for (let i = bubbles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
        }

        // Track the last positive/negative for the next day's "no-back-to-back" logic
        const lastPositive = bubbles.slice().reverse().find(b => b.positive);
        const lastNegative = bubbles.slice().reverse().find(b => !b.positive);
        if (lastPositive) this.lastFeedback.positive = lastPositive.message;
        if (lastNegative) this.lastFeedback.negative = lastNegative.message;

        return bubbles;
    }

    // Short narrative paragraph — the day's story in a sentence or two.
    generateNarrative(customers, revenue, netProfit, events) {
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = weekDays[this.gameState.day % 7];

        const weatherEvent = events.find(e =>
            ['sunny_day', 'rainy_day', 'cold_snap', 'heatwave'].includes(e.type));
        let lead;
        if (weatherEvent?.type === 'sunny_day')  lead = `Sunny ${dayName}.`;
        else if (weatherEvent?.type === 'rainy_day') lead = `Wet ${dayName}, quiet streets.`;
        else if (weatherEvent?.type === 'cold_snap')  lead = `Cold ${dayName}, frigid lunch.`;
        else if (weatherEvent?.type === 'heatwave')   lead = `Hot ${dayName}, sidewalks empty.`;
        else lead = `${dayName}.`;

        let body = ` ${customers} walked up, ${revenue.actualSales} bought.`;
        if (revenue.lostSales > 0) body += ` Turned ${revenue.lostSales} away — ran low on supplies.`;
        if (this.gameState.regulars > 5) {
            const regularsToday = Math.min(this.gameState.regulars, customers);
            body += ` Regulars made up a chunk of it.`;
        }
        const profitStr = netProfit >= 0
            ? `Net: +$${Math.round(netProfit).toLocaleString()}.`
            : `Net: -$${Math.round(Math.abs(netProfit)).toLocaleString()}.`;
        body += ` ${profitStr}`;

        return lead + body;
    }

    // Extract modifiers from events — data-driven via the catalog.
    getEventModifiers(events) {
        const modifiers = { costMultiplier: 1.0, customerMultiplier: 1.0 };
        events.forEach(event => {
            if (event.customerMult !== undefined) modifiers.customerMultiplier *= event.customerMult;
            if (event.costMult !== undefined)     modifiers.costMultiplier *= event.costMult;
        });
        return modifiers;
    }

    // Calculate reputation changes — can go negative on bad days.
    calculateReputationChange(revenue, costs) {
        let reputationChange = Math.floor(revenue.actualSales / 5);

        if (revenue.conversionRate > 0.8) {
            reputationChange += 2;
        }

        const netProfit = revenue.totalRevenue - costs.totalCosts;

        if (netProfit < 0) {
            reputationChange -= 3;
        } else {
            const profitMargin = revenue.totalRevenue > 0
                ? netProfit / revenue.totalRevenue
                : 0;
            if (profitMargin < 0.1) {
                reputationChange -= 1;
            }
        }

        return reputationChange;
    }

    // Process marketing growth
    processMarketingGrowth(sales) {
        const marketing = this.gameState.marketing;

        // Only grow followers if camera setup is purchased
        if (!marketing.hasCameraSetup) {
            return;
        }

        // Slow growth — 0-2 followers per sale, feels earned over time.
        let followerGrowth = sales > 0
            ? Math.floor(sales * (0.5 + Math.random() * 1.5) / 3)
            : 0;

        // Social media ads boost follower growth
        if (marketing.hasSocialMediaAds) {
            followerGrowth += GameData.marketingOptions.socialMediaAds.benefits.followerGrowth || 25;
        }

        // Viral cooldown prevents compounding daily viral hits.
        if (marketing.viralCooldown > 0) {
            marketing.viralCooldown -= 1;
            marketing.lastViralBonus = 0;
        } else {
            let viralChance = GameData.marketingOptions.cameraSetup.benefits.viralChance || 0.05;
            if (marketing.hasInfluencerCollab) {
                viralChance = GameData.marketingOptions.influencerCollab.benefits.viralChance || 0.15;
            }

            if (Math.random() < viralChance) {
                const viralBonus = Math.floor(50 + Math.random() * 100);
                followerGrowth += viralBonus;
                marketing.lastViralBonus = viralBonus;
                marketing.viralCooldown = 5; // 5-day cooldown between viral hits
            } else {
                marketing.lastViralBonus = 0;
            }
        }

        this.gameState.addFollowers(followerGrowth);
    }

    // Shuffle each supplier's unit price by ±15% for the coming day.
    // Occasionally a bigger shock (up to ±30%) for drama.
    refreshMarketPrices() {
        const prices = {};
        Object.keys(GameData.supplierTypes).forEach(key => {
            const shock = Math.random() < 0.1 ? 0.3 : 0.15;
            prices[key] = +(1 + (Math.random() * 2 - 1) * shock).toFixed(3);
        });
        this.gameState.setMarketPrices(prices);
    }

    // Regulars grow slowly through good days, shrink on bad ones.
    // They form a reliable base of customers past opening week.
    processRegulars(events, netProfit, lostSales) {
        if (this.gameState.day <= GameData.progression.openingWeekDays) return;

        const businessType = this.gameState.business.type;
        const cap = businessType === 'chain' ? 200
                   : businessType === 'restaurant' ? 80
                   : 30;

        let rg = this.gameState.regulars;
        const hadBadEvent = events.some(e =>
            e.type === 'bad_review' || e.type === 'health_scare');

        if (hadBadEvent) {
            rg *= 0.75;
        } else if (lostSales > 0) {
            // Ran out of food with customers waiting → regulars lose trust.
            rg *= 0.9;
        } else if (netProfit > 0) {
            rg += 0.3 + Math.random() * 0.4;
        } else if (netProfit < 0) {
            rg *= 0.95;
        }

        this.gameState.setRegulars(Math.min(rg, cap));
    }

    // Generate random events — low chance, high variety.
    generateRandomEvents() {
        const events = [];
        const eventChance = 0.07;
        if (Math.random() >= eventChance) return events;

        const catalog = GameData.eventCatalog;
        const totalWeight = catalog.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * totalWeight;
        let chosen = catalog[0];
        for (const e of catalog) {
            roll -= e.weight;
            if (roll <= 0) { chosen = e; break; }
        }

        const lastMsg = this.lastEventMessage[chosen.type] || '';
        const message = GameData.getEventMessage(chosen.type, lastMsg);
        this.lastEventMessage[chosen.type] = message;

        const event = { ...chosen, message };
        events.push(event);
        this.applyEventEffects(chosen);

        return events;
    }

    // Apply one event's declarative effects to game state.
    applyEventEffects(event) {
        if (event.rep !== undefined) {
            if (event.rep >= 0) this.gameState.addReputation(event.rep);
            else this.gameState.setReputation(this.gameState.reputation + event.rep);
        }
        if (event.tip !== undefined) {
            this.gameState.addMoney(event.tip);
        }
        if (event.cost !== undefined) {
            this.gameState.spendMoney(Math.min(event.cost, this.gameState.money));
        }
        if (event.repairCost) {
            const type = this.gameState.business.type;
            const amt = type === 'chain' ? 3500 : type === 'restaurant' ? 2000 : 800;
            this.gameState.spendMoney(Math.min(amt, this.gameState.money));
        }
        if (event.followers !== undefined && this.gameState.marketing.hasCameraSetup) {
            this.gameState.addFollowers(event.followers);
        }
        if (event.followerLoss !== undefined && this.gameState.marketing.followers > 0) {
            const lost = Math.floor(this.gameState.marketing.followers * event.followerLoss);
            this.gameState.marketing.followers = Math.max(
                0, this.gameState.marketing.followers - lost
            );
        }
        if (event.removeEmployee && this.gameState.employees.length > 0) {
            const idx = Math.floor(Math.random() * this.gameState.employees.length);
            this.gameState.removeEmployee(idx);
        }
    }

    // Check if business can afford an expense
    canAfford(amount) {
        return this.gameState.money >= amount;
    }

    // Purchase an employee
    purchaseEmployee(employeeType) {
        const empData = GameData.getEmployeeType(employeeType);
        const businessType = this.gameState.business.type;
        
        if (!empData) return { success: false, message: 'Invalid employee type' };

        // Check if employee type is available for current business type
        if (!empData.businessTypes.includes(businessType)) {
            return { success: false, message: `${empData.name} not available for ${businessType}` };
        }

        // Check hiring limits
        if (!GameData.canHireEmployee(employeeType, this.gameState.employees, businessType)) {
            const maxCount = empData.maxCount[businessType];
            const currentCount = GameData.getEmployeeCount(employeeType, this.gameState.employees);
            return { success: false, message: `Maximum ${empData.name} limit reached (${currentCount}/${maxCount})` };
        }

        // Check if can afford
        if (!this.canAfford(empData.salary)) {
            return { success: false, message: `Not enough money. Need $${empData.salary.toLocaleString()}` };
        }

        // Hire the employee
        this.gameState.spendMoney(empData.salary);
        this.gameState.addEmployee({
            type: employeeType,
            salary: empData.salary,
            hiredDay: this.gameState.day
        });
        
        return { success: true, message: `Successfully hired ${empData.name}!` };
    }

    // Purchase an upgrade
    purchaseUpgrade(upgradeType) {
        const upgradeData = GameData.getUpgradeType(upgradeType);
        if (!upgradeData) return false;

        if (this.canAfford(upgradeData.cost) && !this.gameState.upgrades[upgradeType]) {
            this.gameState.spendMoney(upgradeData.cost);
            this.gameState.purchaseUpgrade(upgradeType);
            return true;
        }
        return false;
    }

    // Purchase marketing
    purchaseMarketing(marketingType) {
        const marketingData = GameData.marketingOptions[marketingType];
        if (!marketingData) return false;

        if (this.canAfford(marketingData.cost)) {
            this.gameState.spendMoney(marketingData.cost);
            this.gameState.purchaseMarketing(marketingType);
            return true;
        }
        return false;
    }
}

// Export for module usage
window.BusinessLogic = BusinessLogic;