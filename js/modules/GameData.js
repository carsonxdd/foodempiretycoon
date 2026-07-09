/**
 * GameData Module - Static game data and configurations
 */
class GameData {
    static locations = [
        {
            name: 'Riverside District',
            type: 'tourist',
            population: 50000,
            description: 'A bustling tourist area with high foot traffic and seasonal visitors.',
            stats: {
                footTraffic: 'High',
                competition: 'Medium',
                rent: 'High',
                customerType: 'Tourists'
            },
            modifiers: {
                customerBase: 1.2,
                seasonalBonus: 1.3,
                rentCost: 630
            }
        },
        {
            name: 'University Square',
            type: 'college',
            population: 75000,
            description: 'Located near the university campus with a young, hungry student population.',
            stats: {
                footTraffic: 'Very High',
                competition: 'High',
                rent: 'Medium',
                customerType: 'Students'
            },
            modifiers: {
                customerBase: 1.5,
                weekendBonus: 0.7,
                rentCost: 460
            }
        },
        {
            name: 'Business District',
            type: 'business',
            population: 100000,
            description: 'The heart of the city\'s business area with busy professionals.',
            stats: {
                footTraffic: 'High',
                competition: 'Medium',
                rent: 'Very High',
                customerType: 'Professionals'
            },
            modifiers: {
                customerBase: 1.1,
                weekdayBonus: 1.4,
                rentCost: 880
            }
        }
    ];

    static employeeTypes = {
        cook: {
            name: 'Cook',
            salary: 600,
            benefits: {
                customerSatisfaction: 0.12,
                serviceSpeed: 0.15,
                priceMultiplier: 1.08
            },
            description: 'Improves food quality and cooking speed',
            businessTypes: ['foodTruck', 'restaurant'],
            maxCount: { foodTruck: 3, restaurant: 8 }
        },
        cashier: {
            name: 'Cashier',
            salary: 400,
            benefits: {
                serviceSpeed: 0.25,
                customerCapacity: 5,
                orderAccuracy: 0.15
            },
            description: 'Handles orders and payments efficiently',
            businessTypes: ['foodTruck', 'restaurant'],
            maxCount: { foodTruck: 1, restaurant: 3 }
        },
        // Restaurant-only employees (for future expansion)
        chef: {
            name: 'Head Chef',
            salary: 1000,
            benefits: {
                customerSatisfaction: 0.2,
                serviceSpeed: 0.1,
                priceMultiplier: 1.15,
                menuExpansion: true
            },
            description: 'Professional chef for restaurant operations',
            businessTypes: ['restaurant'],
            maxCount: { restaurant: 2 }
        },
        server: {
            name: 'Server',
            salary: 500,
            benefits: {
                customerSatisfaction: 0.1,
                customerCapacity: 8,
                tipIncome: 75
            },
            description: 'Provides table service for restaurant guests',
            businessTypes: ['restaurant'],
            maxCount: { restaurant: 6 }
        },
        manager: {
            name: 'Manager',
            salary: 900,
            benefits: {
                overallEfficiency: 0.15,
                employeeBonus: 0.1,
                customerSatisfaction: 0.08
            },
            description: 'Manages operations and boosts team performance',
            businessTypes: ['restaurant'],
            maxCount: { restaurant: 1 }
        }
    };

    static upgradeTypes = {
        kitchenEquipment: {
            name: 'Better Kitchen Equipment',
            cost: 3000,
            benefits: {
                serviceSpeed: 0.25,
                foodQuality: 0.2,
                customerSatisfaction: 0.1
            },
            description: 'Faster cooking and better food quality'
        },
        seating: {
            name: 'Improved Seating',
            cost: 2500,
            benefits: {
                customerCapacity: 8,
                customerSatisfaction: 0.15,
                averageSpend: 1.1
            },
            description: 'More customers can be served comfortably'
        },
        soundSystem: {
            name: 'Sound System',
            cost: 1500,
            benefits: {
                customerSatisfaction: 0.1,
                brandRecognition: 0.05
            },
            description: 'Creates better atmosphere for customers'
        },
        fridgeUpgrade: {
            name: 'Commercial Refrigerator',
            cost: 4000,
            benefits: {
                inventoryCapacity: 2.0,
                foodWaste: -0.3
            },
            description: 'Store more ingredients with less spoilage'
        }
    };

    // Simple ingredients everyone understands. Orders are 10 units at a time.
    // basePrice/10 = cost per unit consumed on a sale — kept low enough that
    // a core-only dish (bread+meat+cheese) leaves real margin under its base
    // menu price (see foodTypes below).
    static supplierTypes = {
        bread: {
            name: 'Bread', icon: '🍞', basePrice: 2.5,
            description: 'Buns, tortillas, pizza dough, sandwich loaves',
            isCore: true,
        },
        vegetables: {
            name: 'Vegetables', icon: '🥬', basePrice: 2,
            description: 'Lettuce, tomatoes, onions, fresh toppings',
            isCore: true,
        },
        meat: {
            name: 'Meat', icon: '🥩', basePrice: 5,
            description: 'Beef, chicken, pork — the protein',
            isCore: true,
        },
        cheese: {
            name: 'Dairy', icon: '🧀', basePrice: 3,
            description: 'Cheese, butter, cream, sauce bases',
            isCore: true,
        },
        drinks: {
            name: 'Drinks', icon: '🥤', basePrice: 1.5,
            description: 'Soda, water, juice — part of the meal deal',
            isCore: false, isMeal: true,
        },
        sides: {
            name: 'Sides', icon: '🍟', basePrice: 1.5,
            description: 'Fries, chips, rice — completes the meal',
            isCore: false, isMeal: true,
        },
    };

    // Recipe addons — toggleable on the Recipe tab. Not suppliers; they consume
    // extra units of their parent category per sale.
    // e.g. adding Bacon means 2 meat per sale (1 for the base patty + 1 for bacon).
    // `foods` restricts which food types offer the addon in the Recipe tab UI
    // (see UIManager.updateRecipePanel) — omit it for an addon that fits every
    // food. Consumption/pricing math doesn't care about the tag; it's purely
    // what gets offered, so each food's topping list reads distinct.
    static recipeAddons = {
        lettuce: {
            name: 'Lettuce', icon: '🥬', parent: 'vegetables', consumption: 1,
            description: 'Crisp and fresh — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.015,
            foods: ['sandwiches', 'burgers', 'tacos'],
        },
        tomato: {
            name: 'Tomato', icon: '🍅', parent: 'vegetables', consumption: 1,
            description: 'Ripe slice — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.015,
        },
        bacon: {
            name: 'Bacon', icon: '🥓', parent: 'meat', consumption: 1,
            description: 'Extra meat on the sandwich — +1 meat/sale',
            priceBonus: 1.5, appealBonus: 0.03,
            foods: ['sandwiches', 'burgers', 'pizza'],
        },
        mushrooms: {
            name: 'Mushrooms', icon: '🍄', parent: 'vegetables', consumption: 1,
            description: 'Sautéed mushrooms — +1 veg/sale',
            priceBonus: 1.0, appealBonus: 0.02,
            foods: ['burgers', 'pizza'],
        },
        onions: {
            name: 'Onions', icon: '🧅', parent: 'vegetables', consumption: 1,
            description: 'Fresh or caramelized — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.015,
        },
        pickles: {
            name: 'Pickles', icon: '🥒', parent: 'vegetables', consumption: 1,
            description: 'Tangy crunch — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.01,
            foods: ['sandwiches', 'burgers'],
        },
        sauce: {
            name: 'Signature Sauce', icon: '🫙', parent: 'cheese', consumption: 1,
            description: 'House-made special (mayo/aioli base) — +1 dairy/sale',
            priceBonus: 1.0, appealBonus: 0.025,
        },
        jalapenos: {
            name: 'Jalapeños', icon: '🌶️', parent: 'vegetables', consumption: 1,
            description: 'Spicy kick — +1 veg/sale',
            priceBonus: 0.75, appealBonus: 0.015,
            foods: ['sandwiches', 'burgers', 'tacos'],
        },
        // --- Pizza-specific ---------------------------------------------
        parmesan: {
            name: 'Parmesan', icon: '🧂', parent: 'cheese', consumption: 1,
            description: 'Shredded finishing cheese — +1 dairy/sale',
            priceBonus: 0.75, appealBonus: 0.02,
            foods: ['pizza'],
        },
        spicyPeppers: {
            name: 'Spicy Peppers', icon: '🫑', parent: 'vegetables', consumption: 1,
            description: 'Pepperoncini rings for heat — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.02,
            foods: ['pizza'],
        },
        basil: {
            name: 'Fresh Basil', icon: '🌿', parent: 'vegetables', consumption: 1,
            description: 'Torn basil leaves — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.02,
            foods: ['pizza'],
        },
        pepperoni: {
            name: 'Pepperoni', icon: '🍖', parent: 'meat', consumption: 1,
            description: "Pizza's only meat option, cupped and crisped — +1 meat/sale",
            priceBonus: 1.25, appealBonus: 0.03,
            foods: ['pizza'],
        },
        // --- Taco-specific ------------------------------------------------
        sourCream: {
            name: 'Sour Cream', icon: '🥛', parent: 'cheese', consumption: 1,
            description: 'Cool dairy dollop — +1 dairy/sale',
            priceBonus: 0.5, appealBonus: 0.02,
            foods: ['tacos'],
        },
        cilantro: {
            name: 'Cilantro', icon: '🌱', parent: 'vegetables', consumption: 1,
            description: 'Fresh chopped cilantro — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.02,
            foods: ['tacos'],
        },
        // --- Shared specialty ----------------------------------------------
        avocado: {
            name: 'Avocado', icon: '🥑', parent: 'vegetables', consumption: 1,
            description: 'Creamy sliced avocado — +1 veg/sale',
            priceBonus: 1.0, appealBonus: 0.025,
            foods: ['sandwiches', 'burgers', 'tacos'],
        },
        // --- Burger-specific -------------------------------------------
        friedEgg: {
            name: 'Fried Egg', icon: '🍳', parent: 'meat', consumption: 1,
            description: 'Over-easy, breaks over the patty — +1 meat/sale',
            priceBonus: 1.25, appealBonus: 0.025,
            foods: ['burgers'],
        },
    };

    static isAddon(key) { return !!this.recipeAddons[key]; }
    static getAddon(key) { return this.recipeAddons[key] || null; }

    // Total ingredient units required per sale, aggregated by parent category.
    // Cores contribute 1. Addons add `consumption` to their parent.
    // Meal mode adds drinks + sides.
    static computeRecipeConsumption(setup) {
        const recipe = setup.recipe || [];
        const cons = {};

        recipe.forEach(key => {
            if (this.supplierTypes[key]?.isCore) {
                cons[key] = (cons[key] || 0) + 1;
            } else if (this.recipeAddons[key]) {
                const a = this.recipeAddons[key];
                cons[a.parent] = (cons[a.parent] || 0) + (a.consumption || 1);
            }
        });

        if (setup.mealMode) {
            cons.drinks = (cons.drinks || 0) + 1;
            cons.sides = (cons.sides || 0) + 1;
        }

        return cons;
    }

    // Meal mode adds this much to each sale, and requires a drink + side.
    static mealBonus = 5;

    // Bulk-pricing tiers applied to supplier orders. Unit price is base * multiplier.
    static supplyTiers = [
        { min: 50, mult: 0.90, label: '−10% bulk' },
        { min: 25, mult: 0.95, label: '−5% bulk' },
        { min: 10, mult: 1.00, label: 'Standard' },
        { min: 1,  mult: 1.10, label: '+10% small order' },
    ];

    static getSupplyTier(quantity) {
        return this.supplyTiers.find(t => quantity >= t.min) || this.supplyTiers[this.supplyTiers.length - 1];
    }

    // Default market multiplier — 1.0 everywhere, hard mode jitters this daily.
    static defaultMarketPrices() {
        const out = {};
        Object.keys(this.supplierTypes).forEach(k => { out[k] = 1.0; });
        return out;
    }

    // Premium tier — cost, unlock rules, and conversion bonus.
    static premium = {
        multiplier: 1.8,
        unlockDay: 30,
        unlockOrders: 10,
        conversionBonusPerIngredient: 0.03,
    };

    static defaultSupplierTiers() {
        const out = {};
        Object.keys(this.supplierTypes).forEach(k => { out[k] = 'basic'; });
        return out;
    }

    static defaultSupplierOrders() {
        const out = {};
        Object.keys(this.supplierTypes).forEach(k => { out[k] = 0; });
        return out;
    }

    static marketingOptions = {
        cameraSetup: {
            name: 'Camera & Mic Setup',
            cost: 5000,
            benefits: {
                socialMediaAccess: true,
                viralChance: 0.05,
                followerGrowthRate: 10
            },
            description: 'Start creating social media content'
        },
        socialMediaAds: {
            name: 'Social Media Advertising',
            cost: 500,
            recurring: true,
            benefits: {
                followerGrowth: 25,
                customerBoost: 0.1
            },
            description: 'Monthly advertising campaign'
        },
        influencerCollab: {
            name: 'Influencer Collaboration',
            cost: 2000,
            benefits: {
                followerGrowth: 100,
                viralChance: 0.15,
                oneTimeBoost: 50
            },
            description: 'Partner with local food influencer'
        }
    };

    static difficultySettings = {
        easy: {
            name: 'Easy',
            startingMoney: 7000,
            costMultiplier: 0.85,
            customerMultiplier: 1.30,
            description: 'Real food truck start with some cushion'
        },
        normal: {
            name: 'Normal',
            startingMoney: 5000,
            costMultiplier: 1.0,
            customerMultiplier: 1.0,
            description: 'The grind — what a real food truck faces'
        },
        hard: {
            name: 'Hard',
            startingMoney: 3000,
            costMultiplier: 1.2,
            customerMultiplier: 0.85,
            description: 'Living lean — one bad week and you fold'
        }
    };

    // Employee leveling — pay-to-train system. Each employee starts at L1
    // and can be trained up to L3 for measurable speed/conversion gains plus
    // proportional reduction in the complaints they fix. Salary scales with
    // level (you're paying for the trained version), training is paid up
    // front and takes real game days.
    static employeeLeveling = {
        maxLevel: 3,
        // Cost to train UP TO this level (e.g. 2 = cost to go L1→L2).
        trainingCost: { 2: 1500, 3: 3500 },
        // Game days to complete training to this level.
        trainingDays: { 2: 7, 3: 14 },
        // Salary multiplier applied to base employeeTypes[type].salary at
        // each level. Higher trained = costlier on the books.
        salaryMultiplier: { 1: 1.0, 2: 1.4, 3: 1.9 },
        // Multiplier on every benefit number (conversion bumps, customer
        // capacity, tip income, etc.). Keeps the existing math centralized.
        benefitMultiplier: { 1: 1.0, 2: 1.5, 3: 2.0 },
    };

    static getEmployeeSalary(emp) {
        const data = this.getEmployeeType(emp.type);
        if (!data) return 0;
        const lvl = emp.level || 1;
        const mult = this.employeeLeveling.salaryMultiplier[lvl] || 1.0;
        return data.salary * mult;
    }

    static getEmployeeBenefitMultiplier(emp) {
        const lvl = emp?.level || 1;
        return this.employeeLeveling.benefitMultiplier[lvl] || 1.0;
    }

    static canTrainEmployee(emp) {
        if (!emp || emp.training) return null;
        const next = (emp.level || 1) + 1;
        if (next > this.employeeLeveling.maxLevel) return null;
        return {
            targetLevel: next,
            cost: this.employeeLeveling.trainingCost[next],
            days: this.employeeLeveling.trainingDays[next],
        };
    }

    // Reputation tiers — names + thresholds layered on top of the existing
    // numeric `gameState.reputation`. Math elsewhere (customer count,
    // conversion bonus) stays the number; tiers are for player-facing
    // surfacing AND as a fix-progress lever for the "this place is dead"
    // marketing complaints (see fixHints "slow" rule).
    static reputationTiers = [
        { name: 'Unknown',     min: 0,   icon: '👤', progressContribution: 0   },
        { name: 'Local Spot',  min: 25,  icon: '📍', progressContribution: 0.3 },
        { name: 'Buzzing',     min: 75,  icon: '🔥', progressContribution: 0.6 },
        { name: 'Hot Spot',    min: 200, icon: '⭐', progressContribution: 0.9 },
        { name: 'Iconic',      min: 500, icon: '🏆', progressContribution: 1.0 },
    ];

    // Returns { name, icon, min, next, progressContribution, progressToNext }.
    // `progressToNext` is 0..1 toward the next tier (1.0 = at/past max).
    static getReputationTier(rep = 0) {
        const tiers = this.reputationTiers;
        let current = tiers[0];
        let next = null;
        for (let i = 0; i < tiers.length; i++) {
            if (rep >= tiers[i].min) {
                current = tiers[i];
                next = tiers[i + 1] || null;
            }
        }
        const progressToNext = next
            ? Math.min(1, (rep - current.min) / (next.min - current.min))
            : 1.0;
        return {
            name: current.name,
            icon: current.icon,
            min: current.min,
            next,
            progressContribution: current.progressContribution,
            progressToNext,
        };
    }

    static _reputationProgress(s) {
        return this.getReputationTier(s.reputation || 0).progressContribution;
    }

    // Flavor lines for the in-game news/buzz ticker (`GameState.newsFeed`).
    // Populated by GameController when a rep-tier achievement unlocks or a
    // marketing viral hit lands — see GameController.checkAchievements /
    // processNextDay. One line is picked at random per trigger.
    static newsTemplates = {
        tierUp: {
            'Local Spot': [
                "Word's getting around the neighborhood about {name}.",
                "A few regulars have started calling {name} 'their spot.'",
                "{name} just got mentioned in a local group chat.",
            ],
            'Buzzing': [
                "{name} is the talk of the block this week.",
                "Lines are forming earlier just to beat the rush at {name}.",
                "Someone left a glowing review of {name} on their way out.",
            ],
            'Hot Spot': [
                "{name} is officially the place to eat around here.",
                "A local food blogger name-dropped {name} this week.",
                "People are driving out of their way for {name}.",
            ],
            'Iconic': [
                "{name} has become a neighborhood institution.",
                "Ask anyone nearby about food and they'll bring up {name}.",
                "{name}'s reputation has outgrown the block it started on.",
            ],
        },
        viral: [
            "A post about {name} is spreading fast online.",
            "{name} just had a moment — the phones haven't stopped since.",
            "Someone's video of {name} is racking up shares.",
        ],
        rivalGaining: [
            "The truck down the street is pulling ahead of {name} this week.",
            "Regulars have been drifting toward the competition lately.",
            "The rival's out-hustling {name} right now.",
        ],
        playerDominant: [
            "{name} has clearly overtaken the local competition.",
            "Word is the other truck can't keep up with {name} anymore.",
            "{name} is the one people talk about now — not the rival.",
        ],
    };

    // Short quirk lines for named recurring regulars (see
    // BusinessLogic.updateRegularCustomers / generateFeedbackBubbles).
    static regularQuirks = [
        "always orders the same thing",
        "tips well on paydays",
        "brings a different friend every time",
        "asks how business is going",
        "shows up right when you open",
        "knows the whole menu by heart",
        "always in a hurry but never skips a visit",
        "chats for a minute before ordering",
    ];

    static getNewsLine(pool, businessName) {
        if (!pool || pool.length === 0) return '';
        const line = pool[Math.floor(Math.random() * pool.length)];
        return line.replace('{name}', businessName || 'the place');
    }

    // Health inspector — a real branching choice rather than a flat stat
    // roll. Triggered as a pre-day gate in GameController.checkHealthInspectorTrigger
    // (before BusinessLogic.processDailyBusiness runs), not part of eventCatalog,
    // since eventCatalog effects resolve inline with no room for player input.
    // Rival truck — a competing business whose `momentum` (0-100, 50 =
    // neutral) tugs against the player's daily customer count. See
    // BusinessLogic.updateRivalTruck / calculateDailyCustomers.
    static rivalNames = [
        "Riverside Grill Co.", "The Corner Cart", "Taco Bandits",
        "Uptown Eats", "Grease Monkey Grub", "Second Street Kitchen",
        "The Hungry Fox", "Roadside Provisions",
    ];

    static getRandomRivalName() {
        return this.rivalNames[Math.floor(Math.random() * this.rivalNames.length)];
    }

    static healthInspectorEvent = {
        triggerChance: 0.02,
        minDay: 10,
        cooldownDays: 20,
        icon: '🕵️',
        intro: "A health inspector showed up for a walkthrough today.",
        choices: [
            {
                id: 'comply',
                label: 'Comply — fix it up',
                description: 'Pay to fix any issues on the spot. No reputation risk.',
                costByType: { foodTruck: 150, restaurant: 250, chain: 400 },
            },
            {
                id: 'bribe',
                label: 'Slip them something',
                description: 'Cheaper, but risky if it doesn\'t land well.',
                costByType: { foodTruck: 60, restaurant: 100, chain: 150 },
                catchChance: 0.2,
                caughtRepPenalty: -15,
                caughtCostByType: { foodTruck: 300, restaurant: 500, chain: 800 },
            },
            {
                id: 'dispute',
                label: 'Dispute the findings',
                description: 'No cost, but the outcome is a coin flip.',
                successChance: 0.4,
                successRep: 5,
                failRep: -12,
            },
        ],
    };

    // Win and progression thresholds — tuned for grounded play.
    static progression = {
        // Restaurant: ~7 months of consistent play with the current overhead.
        // Tuned so you have to engage with premium suppliers + meal mode to hit it.
        restaurantCost: 40000,
        chainCost: 120000,
        winCondition: 1000000,
        openingWeekDays: 7
    };

    // Format money compactly for tight UI slots: $15,000 → "$15k", $1,200,000 → "$1.2M".
    static formatCompactMoney(amount) {
        if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        if (amount >= 1_000)     return `$${Math.round(amount / 1000)}k`;
        return `$${amount}`;
    }

    // Fixed monthly overhead — the real costs of running a food business.
    // Broken down so the player can see exactly where money goes.
    static fixedCosts = {
        foodTruck: {
            vehiclePayment:  160,   // monthly truck lease
            businessLicense: 55,
            foodPermit:      20,
            insurance:       70,
        },
        restaurant: {
            vehiclePayment:  0,     // sold the truck
            businessLicense: 105,
            foodPermit:      35,
            insurance:       140,
        },
        chain: {
            vehiclePayment:  0,
            businessLicense: 210,
            foodPermit:      70,
            insurance:       280,
        },
    };

    static getFixedCosts(businessType = 'foodTruck') {
        return this.fixedCosts[businessType] || this.fixedCosts.foodTruck;
    }

    // Realistic street-food pricing for the single item. Meal mode adds $5.
    static foodTypes = {
        sandwiches: {
            name: 'Sandwiches',
            basePrice: 7,
            // Bare-bones recipe: bread + meat + cheese. Lettuce/tomato optional.
            coreRecipe: ['bread', 'meat', 'cheese'],
            defaultRecipe: ['bread', 'meat', 'cheese'],
            coreNames: {
                bread:  { name: 'Sliced Bread', icon: '🍞' },
                meat:   { name: 'Turkey',       icon: '🥩' },
                cheese: { name: 'Swiss',        icon: '🧀' },
            },
            customerAppeal: { students: 1.2, professionals: 1.1, tourists: 0.9 }
        },
        pizza: {
            name: 'Pizza (slice)',
            basePrice: 4.50,
            // Pizza's core is dough + sauce + cheese. Pepperoni is a topping.
            coreRecipe: ['bread', 'vegetables', 'cheese'],
            defaultRecipe: ['bread', 'vegetables', 'cheese'],
            coreNames: {
                bread:      { name: 'Dough',        icon: '🍕' },
                vegetables: { name: 'Tomato Sauce', icon: '🍅' },
                cheese:     { name: 'Mozzarella',   icon: '🧀' },
            },
            customerAppeal: { students: 1.4, professionals: 0.9, tourists: 1.1 }
        },
        tacos: {
            name: 'Tacos',
            basePrice: 3.50,
            coreRecipe: ['bread', 'meat', 'cheese'],
            defaultRecipe: ['bread', 'meat', 'cheese'],
            coreNames: {
                bread:  { name: 'Tortilla',    icon: '🌮' },
                meat:   { name: 'Ground Beef', icon: '🥩' },
                cheese: { name: 'Cheddar',     icon: '🧀' },
            },
            customerAppeal: { students: 1.3, professionals: 1.0, tourists: 1.3 }
        },
        burgers: {
            name: 'Burgers',
            basePrice: 7,
            // Classic burger: bun + beef + cheese. Lettuce/tomato/pickles optional.
            coreRecipe: ['bread', 'meat', 'cheese'],
            defaultRecipe: ['bread', 'meat', 'cheese'],
            coreNames: {
                bread:  { name: 'Bun',           icon: '🍞' },
                meat:   { name: 'Beef Patty',    icon: '🥩' },
                cheese: { name: 'Sliced Cheese', icon: '🧀' },
            },
            customerAppeal: { students: 1.2, professionals: 1.2, tourists: 1.0 }
        }
    };

    // Core ingredients required for a *real* version of this food.
    // Missing any of these applies the -15% conversion penalty per slot.
    static getCoreRecipe(foodType) {
        const food = this.foodTypes[foodType];
        return food?.coreRecipe || ['bread', 'vegetables', 'meat', 'cheese'];
    }

    // Look up the food-specific display name for a core ingredient key.
    // Falls back to the supplier's category name if the food has no mapping.
    static getCoreDisplay(foodType, ingredientKey) {
        const food = this.foodTypes[foodType];
        const override = food?.coreNames?.[ingredientKey];
        if (override) return override;
        const s = this.supplierTypes[ingredientKey];
        return s ? { name: s.name, icon: s.icon } : { name: ingredientKey, icon: '' };
    }

    // Customer feedback — pooled by context. Selection uses day state
    // (viral, busy, supply shortage, food type, customer type) to bias picks.
    static positiveFeedback = {
        general: [
            "The food was amazing! Best I've had in a while!",
            "Great service and friendly staff!",
            "The prices are very reasonable!",
            "I love the unique flavors!",
            "Fresh ingredients make all the difference!",
            "Fast service even during rush hour!",
            "Will definitely be coming back!",
            "Recommended this place to all my friends!",
            "The atmosphere is perfect!",
            "Five stars, no notes.",
            "Portions were generous for the price.",
            "Staff remembered my order from last time!",
            "Honestly the highlight of my day.",
            "Clean setup, friendly face at the window.",
            "I've been telling everyone at work about this place.",
        ],
        viral: [
            "Saw you on TikTok and HAD to come try it!",
            "My feed won't stop recommending this place — earned!",
            "The hype is real, y'all.",
            "Came for the viral video, stayed for the flavor.",
            "Tagged you in three stories already!",
            "Influencer was right, this slaps.",
        ],
        busy: [
            "Wild how fast you pushed through that line.",
            "Packed and still fast — respect.",
            "Rush hour and I still got my order in 5 minutes!",
            "You handle a crowd like a pro.",
        ],
        students: [
            "Perfect study-break fuel.",
            "Cheap, fast, filling — exactly what I needed.",
            "Finally a place that takes my budget seriously.",
            "Going to be coming here between every class.",
        ],
        tourists: [
            "Adding this to my city guide!",
            "Best thing I've eaten on this trip.",
            "You made our vacation, seriously.",
            "Taking photos to show everyone back home.",
        ],
        professionals: [
            "Great quick lunch option near the office.",
            "Perfect for a working lunch.",
            "Finally, a lunch spot that actually respects my time.",
            "Bringing the whole team here tomorrow.",
        ],
        sandwiches: [
            "The bread was perfectly toasted!",
            "That spread was unreal, what's in it?",
            "Layers were on point — nothing falling out.",
        ],
        pizza: [
            "Crust was perfect — crispy and chewy!",
            "The cheese pull alone is worth the price.",
            "Best slice I've had in this city.",
        ],
        // Players running the bare-bones default recipe. Some diners love it clean.
        simpleLovers: [
            "Clean and simple — that's how I like it.",
            "No frills, just good food. Respect.",
            "Don't need fancy toppings when the basics are this good.",
            "Minimal menu, maximum flavor.",
            "This is how it should be done.",
            "Back to basics done right. I'm into it.",
        ],
        // Players running a loaded recipe. Some diners are here for the show.
        loadedLovers: [
            "Loaded up and delicious!",
            "Every bite has something different going on.",
            "This is a proper gourmet setup.",
            "So much flavor packed in!",
            "Worth every extra topping you piled on.",
        ],
        // Passers-by who didn't buy but had something nice to say. Used as
        // an easy-mode fallback when actualSales = 0 so the chat still has
        // a friendly voice. These all read fine from someone who didn't eat.
        ambient: [
            "Smelled incredible walking by!",
            "I'll be back when I have more time.",
            "Adding this to my list for next visit.",
            "Looks great — saving up to come try it.",
            "Took a photo of the menu. Definitely returning.",
        ],
        // Fires when the rival truck's momentum has swung well in the
        // player's favor (see BusinessLogic.updateRivalTruck / feedbackContext).
        rivalWin: [
            "Heard you're the better option now compared to the other truck.",
            "A friend said to skip the other place and come here instead.",
            "You've clearly won this block over.",
        ],
    };

    static negativeFeedback = {
        general: [
            "The wait time was a bit long.",
            "Could use more seating options.",
            "The menu is a bit limited.",
            "Prices are a bit high for the portion size.",
            "Food could use more seasoning.",
            "Service was slower than expected.",
            "Ran out of my favorite item.",
            "Need more vegetarian options.",
            "Took two tries to get my order right.",
            "Could use some music or ambiance.",
            "Felt a little rushed.",
            "Not sure I'd come back for that price.",
        ],
        supplyShortage: [
            "Something tasted off today — was this frozen?",
            "Ingredients didn't seem as fresh as usual.",
            "You were out of half the menu!",
            "Noticed the produce was looking a little sad.",
        ],
        busy: [
            "Way too crowded, waited 20 minutes.",
            "Line stretched around the block — not worth it.",
            "You clearly weren't staffed for this crowd.",
            "Felt rushed, like I was on a conveyor belt.",
        ],
        slow: [
            "Nobody was here — is this place still open?",
            "Dead atmosphere, made me question ordering.",
            "Feels like you need to market more.",
        ],
        students: [
            "Portions feel small for a student budget.",
            "Bit pricey for what I got.",
            "Was hoping for something more filling.",
        ],
        tourists: [
            "Didn't feel like anything special or local.",
            "Menu should highlight what makes you unique.",
            "Hoping for something more memorable.",
        ],
        professionals: [
            "No quick lunch combo? Was in a hurry.",
            "I only have 30 minutes, this was too slow.",
            "Needed something faster for the lunch window.",
        ],
        sandwiches: [
            "Bread was stale today, unfortunately.",
            "Fillings didn't stay together in the wrapper.",
            "Could use less mayo, more everything else.",
        ],
        pizza: [
            "Crust was soggy in the middle.",
            "Cheese wasn't melted all the way through.",
            "A little light on the toppings for the price.",
        ],
        // The flip side of simpleLovers — some diners want more than the basics.
        simpleDetractors: [
            "Pretty bare — could use something more.",
            "Needs more going on. Feels plain.",
            "Where are the toppings?",
            "A bit boring, honestly.",
            "Tasty, but basic.",
            "Would love a lettuce or tomato option next time.",
        ],
        // Flip side of loadedLovers — some diners think you went overboard.
        loadedDetractors: [
            "Too much going on — got lost in the toppings.",
            "A bit busy for my taste.",
            "Could tone it down a notch.",
            "Overloaded.",
            "Felt like you threw everything on there.",
        ],
        // Vague non-actionable mild dislikes. People sometimes just don't
        // click with a place — no specific lever the player could pull. These
        // intentionally don't match any fixHints rule, so no 💡 hint shows.
        // Reminder for future authors: not every complaint needs to point at
        // an upgrade. "Just didn't like it" is a real reaction.
        vague: [
            "Eh, it was fine.",
            "Didn't really click for me.",
            "Not for me, but I see the appeal.",
            "Just OK, I guess.",
            "Wasn't really my thing.",
            "It was alright. Nothing to write home about.",
            "Fine, I suppose.",
        ],
        // People who walked up but didn't buy. Fires when customers > actualSales
        // (foot traffic showed up but the conversion didn't land). Each line
        // points at a *reason* for walking away, so it threads through the
        // same fix-hint redundancy logic — fix the underlying problem and the
        // walk-away complaint retires.
        walkedAway: [
            "Saw the price and kept walking.",
            "Line was longer than I had time for.",
            "Couldn't see anything I wanted on the menu.",
            "Was in a rush, you guys looked busy.",
            "Pricey for a quick bite — passed.",
            "Wanted something more filling — kept looking.",
        ],
        // Fires when the rival truck's momentum has swung well in their
        // favor (see BusinessLogic.updateRivalTruck / feedbackContext).
        rival: [
            "Tried the place down the street this time — heard good things.",
            "Almost went to the other truck instead — they're getting popular.",
            "Your competition's been the talk of the block lately.",
        ],
    };

    // Per-addon reaction lines — fire only when that specific topping is in
    // the player's active recipe (see getContextualFeedback). This is what
    // makes each food's build feel distinct: a pizza loaded with pepperoni
    // and parmesan draws different chatter than one with basil, and tacos
    // with cilantro + sour cream read nothing like a plain taco.
    static addonFeedback = {
        lettuce: {
            positive: ["Nice and crisp lettuce, good crunch.", "Loved the fresh lettuce on there."],
            negative: ["Lettuce was a little wilted."],
        },
        tomato: {
            positive: ["That tomato slice was perfectly ripe.", "Fresh tomato really brightened it up."],
            negative: ["Tomato tasted a bit mealy."],
        },
        bacon: {
            positive: ["That bacon was crispy perfection!", "Extra bacon was the right call.", "Smoky bacon really made this."],
            negative: ["Bacon was a little limp, could be crispier."],
        },
        mushrooms: {
            positive: ["Those sautéed mushrooms were incredible.", "Earthy mushroom flavor really came through."],
            negative: ["Mushrooms tasted a bit rubbery."],
        },
        onions: {
            positive: ["Those caramelized onions were sweet perfection.", "Onions added just the right bite."],
            negative: ["Onions were a bit overpowering."],
        },
        pickles: {
            positive: ["That pickle crunch was so satisfying.", "Tangy pickles balanced it out perfectly."],
            negative: ["Pickles were a little too sour for me."],
        },
        sauce: {
            positive: ["That signature sauce is unreal, what's the recipe?", "The house sauce made the whole thing."],
            negative: ["Went a little heavy on the sauce."],
        },
        jalapenos: {
            positive: ["That jalapeño kick was perfect!", "Loved the heat from the jalapeños."],
            negative: ["Jalapeños were way too spicy for me."],
        },
        // Pizza-specific
        parmesan: {
            positive: ["That parmesan finish took it over the top!", "Real shredded parm — could tell immediately."],
            negative: ["Could've used more parmesan on top.", "Barely noticed the parmesan."],
        },
        spicyPeppers: {
            positive: ["Those pepperoncini rings brought the perfect heat!", "Spicy peppers made every bite interesting."],
            negative: ["Peppers were a bit too spicy for a slice."],
        },
        basil: {
            positive: ["Fresh basil made it taste like a real pizzeria.", "That basil aroma when you handed it over — amazing."],
            negative: ["Basil looked a little wilted on top."],
        },
        pepperoni: {
            positive: ["Crispy pepperoni cups, exactly how I like it!", "Finally, a pizza place with real pepperoni."],
            negative: ["Pepperoni was a little greasy."],
        },
        // Taco-specific
        sourCream: {
            positive: ["That cool sour cream balanced the spice perfectly.", "Loved the dollop of sour cream on top."],
            negative: ["Went too heavy on the sour cream."],
        },
        cilantro: {
            positive: ["Fresh cilantro made it taste authentic.", "That cilantro finish was perfect."],
            negative: ["Not a cilantro person, honestly — tasted soapy to me."],
        },
        // Shared specialty
        avocado: {
            positive: ["That avocado was perfectly ripe and creamy!", "Avocado took this to another level."],
            negative: ["Avocado was a little underripe."],
        },
        // Burger-specific
        friedEgg: {
            positive: ["That runny egg yolk over the patty — chef's kiss.", "Fried egg on a burger is genius, more places should do this."],
            negative: ["Egg was cooked past over-easy, wanted it runnier."],
        },
    };

    // First-name pool for on-the-fly customer names.
    static firstNames = [
        'Mia', 'Derek', 'Priya', 'Marcus', 'Nina', 'Jamal', 'Sofia', 'Ethan',
        'Leah', 'Diego', 'Yuki', 'Chen', 'Amara', 'Victor', 'Zara', 'Kai',
        'Rosa', 'Ahmed', 'Ingrid', 'Theo', 'Maya', 'Oscar', 'Luna', 'Finn',
        'Nadia', 'Hugo', 'Iris', 'Ravi', 'Tessa', 'Felix', 'Ava', 'Leo',
        'Sadie', 'Omar', 'Zoe', 'Milo', 'Harper', 'Sage', 'Remi', 'Wren',
        'Juno', 'Cass', 'Nico', 'Lila', 'Max', 'Elena', 'Jin', 'Ada',
    ];

    static getRandomName(exclude = []) {
        const pool = this.firstNames.filter(n => !exclude.includes(n));
        const source = pool.length > 0 ? pool : this.firstNames;
        return source[Math.floor(Math.random() * source.length)];
    }

    // Rotating report headings. {day} replaced with the closing day number.
    static reportHeadings = [
        "Daily Business Report — Day {day}",
        "End of Shift Summary — Day {day}",
        "Day {day} Wrap-Up",
        "Today's Numbers — Day {day}",
        "Day {day} Results",
        "Closing Time — Day {day}",
        "Day {day} Recap",
        "Day {day} Tally",
        "Day {day} Ledger",
        "Day {day} in Review",
        "Cash Register Close — Day {day}",
        "Post-Shift Breakdown — Day {day}",
        "Day {day} Debrief",
        "End of Day {day} Sheet",
        "Day {day} Scoreboard",
    ];

    // Flavor lines shown under the resume-game snapshot — one picked at random
    // each time the modal opens. Grounded/gritty, not chipper "welcome back!" copy.
    static resumeFlavor = [
        "Rent's still due. The regulars kept coming.",
        "The truck's cold, but the regulars still remember your order.",
        "Nobody's manned the window since you left. Time to get back to it.",
        "The books didn't close themselves.",
        "Somewhere out there, a regular is wondering where you went.",
        "The grease trap isn't going to clean itself.",
        "Business doesn't pause just because you did.",
        "Bills came due whether you were here or not.",
    ];

    static getResumeFlavor() {
        return this.resumeFlavor[Math.floor(Math.random() * this.resumeFlavor.length)];
    }

    // Event definitions — type keys map to eventMessages below.
    // Weight controls how often each fires relative to others.
    // Modifier and effect fields are consulted by BusinessLogic.
    static eventCatalog = [
        // Positive / neutral
        { type: 'sunny_day',          icon: '☀️', weight: 4, customerMult: 1.25 },
        { type: 'food_critic',        icon: '⭐', weight: 2, rep: 10 },
        { type: 'health_inspection',  icon: '✅', weight: 2, rep: 5 },
        { type: 'local_event',        icon: '🎉', weight: 2, customerMult: 1.4 },
        { type: 'regular_birthday',   icon: '🎂', weight: 2, tip: 15 },
        { type: 'kid_dropped_food',   icon: '🍦', weight: 2, tip: -8, rep: 3 },
        { type: 'tourist_photo',      icon: '📸', weight: 2, followers: 12 },
        { type: 'radio_mention',      icon: '📻', weight: 1, customerMult: 1.2, rep: 4 },
        { type: 'dog_visit',          icon: '🐕', weight: 2 },
        { type: 'proposal_nearby',    icon: '💍', weight: 1, rep: 2, customerMult: 1.15 },
        { type: 'slow_afternoon',     icon: '🪑', weight: 3, customerMult: 0.7 },
        { type: 'haggler',            icon: '😒', weight: 2 },
        // Weather (negative-leaning)
        { type: 'rainy_day',          icon: '🌧️', weight: 4, customerMult: 0.55 },
        { type: 'cold_snap',          icon: '🥶', weight: 2, customerMult: 0.7 },
        { type: 'heatwave',           icon: '🔥', weight: 2, customerMult: 0.8 },
        // Negative with cost
        { type: 'supply_shortage',    icon: '📦', weight: 3, costMult: 1.2 },
        { type: 'equipment_breakdown',icon: '🔧', weight: 2, customerMult: 0.6, repairCost: true },
        { type: 'bad_review',         icon: '👎', weight: 2, customerMult: 0.75, rep: -8, followerLoss: 0.05 },
        { type: 'staff_quit',         icon: '🚪', weight: 1, removeEmployee: true },
        { type: 'parking_ticket',     icon: '🎟️', weight: 2, cost: 75 },
        { type: 'card_reader_down',   icon: '💳', weight: 2, customerMult: 0.8 },
        { type: 'gas_price_spike',    icon: '⛽', weight: 2, cost: 40 },
        { type: 'health_scare',       icon: '🤢', weight: 1, rep: -6, customerMult: 0.7 },
        { type: 'permit_inspection',  icon: '📋', weight: 2, cost: 50 },
    ];

    // Event message variants — one is chosen at random each time the event fires.
    static eventMessages = {
        supply_shortage: [
            "Supply shortage! Ingredients cost 20% more today.",
            "Your produce supplier called out — emergency sourcing +20%.",
            "A nearby truck cleaned out the market. Ingredients +20%.",
            "Fuel prices spiked. Deliveries cost 20% more today.",
            "Frost hit the farms. Produce +20% while it lasts.",
        ],
        food_critic: [
            "A food critic visited! Your reputation gets a boost.",
            "Local paper wrote you up. Reputation +10.",
            "A food blogger raved about you online!",
            "Someone with a verified food Instagram stopped by. Nice.",
            "A Michelin inspector was spotted... allegedly.",
        ],
        sunny_day: [
            "Beautiful weather brings 25% extra customers!",
            "Picture-perfect day — foot traffic jumps 25%.",
            "Sunshine everywhere. The line won't stop.",
            "Park filled up and so did your line. +25% customers.",
        ],
        health_inspection: [
            "Passed health inspection! Reputation boost!",
            "Surprise inspection — you aced it. +5 rep.",
            "Inspector left smiling. Reputation +5.",
            "Clean run on the health check. Well-earned rep.",
        ],
        local_event: [
            "A local festival brings more foot traffic!",
            "Block party down the street — +40% customers.",
            "Game day crowd spilled over. Line's out the door!",
            "Convention in town. Every seat is taken.",
        ],
        equipment_breakdown: [
            "Fryer went down. Repair bill + lost sales.",
            "POS terminal crashed mid-rush — chaos.",
            "Generator blew. Had to close early for repairs.",
            "Walk-in fridge died overnight. Ingredient loss stings.",
        ],
        bad_review: [
            "A scathing review blew up online. Reputation took a hit.",
            "Someone posted a bad TikTok. Followers unfollowed.",
            "One-star review went viral. Ouch.",
            "Food blogger roast — hurts the brand.",
        ],
        staff_quit: [
            "An employee walked out mid-shift!",
            "Staff member gave zero notice and left.",
            "One of your team quit for a chain gig.",
            "Burnout caught up. Someone tendered resignation.",
        ],
        regular_birthday: [
            "A regular's birthday — the table tipped big.",
            "Birthday crew came through and left $15 extra.",
            "Regular brought their party, tipped generously.",
        ],
        kid_dropped_food: [
            "A kid dropped their meal. You comped a replacement.",
            "Little one had a spill — you covered it. Parent almost cried.",
            "Gave a freebie after an accident. Worth the rep.",
        ],
        tourist_photo: [
            "A tourist took 12 photos. Fresh followers incoming.",
            "Out-of-towner filmed everything. +12 followers.",
            "Photogenic day — someone posted their whole meal.",
        ],
        radio_mention: [
            "Local radio name-dropped you on a food segment.",
            "A DJ mentioned you on air — traffic bumped.",
            "Morning show shout-out. +reputation, +customers.",
        ],
        dog_visit: [
            "A good dog tied up out front. Owner tipped an extra buck.",
            "Golden retriever posted up while their human ate.",
            "Some pup's tail wagged so hard it drew a crowd.",
        ],
        proposal_nearby: [
            "Someone proposed near your truck. Everyone bought food after.",
            "Wedding proposal on the street — crowd of onlookers, good for business.",
            "Proposal nearby brought a wave of happy customers.",
        ],
        slow_afternoon: [
            "Dead stretch after lunch — nothing to do but wait.",
            "Afternoon lull hit hard today.",
            "Customers dropped off by 2pm. Slow crawl to close.",
        ],
        haggler: [
            "A guy argued about pricing for 20 minutes. Tired.",
            "Haggler came through — you held the line but it cost energy.",
            "Someone insisted the menu was too expensive. You disagreed.",
        ],
        rainy_day: [
            "Downpour all day. Almost nobody came out.",
            "Rain kept most walk-ups away.",
            "Gray, wet, quiet — a tough day for street food.",
        ],
        cold_snap: [
            "Cold snap — nobody wants to eat outside.",
            "Freezing wind killed the lunch rush.",
            "Too cold for a truck meal today.",
        ],
        heatwave: [
            "Heatwave pushed customers into A/C.",
            "Sidewalks were deserted in this heat.",
            "Too hot to stand in line. Slow day.",
        ],
        parking_ticket: [
            "Meter maid got you. Parking ticket hurt.",
            "Permit-adjacent citation — $75 down the drain.",
            "Parking enforcement — ticket written up.",
        ],
        card_reader_down: [
            "Card reader crashed mid-service. Lost cash-only sales.",
            "Point-of-sale went dark for an hour.",
            "Payment system glitched — walked customers.",
        ],
        gas_price_spike: [
            "Fuel prices spiked. Generator costs more to run.",
            "Gas bill hit harder than expected today.",
            "Diesel up overnight. Feels every drop.",
        ],
        health_scare: [
            "A customer felt ill after eating. False alarm, but the story spread.",
            "Stomach bug rumor making the rounds — not your fault.",
            "Someone posted that they got sick. Rep hit.",
        ],
        permit_inspection: [
            "Surprise permit check — minor fee to stay compliant.",
            "Compliance fee popped up unexpectedly.",
            "Paperwork fix cost you a small fine.",
        ],
    };

    // Achievement definitions
    static achievements = {
        firstEmployee: {
            name: "Team Builder",
            description: "Hire your first employee",
            reward: 500
        },
        firstUpgrade: {
            name: "Investor",
            description: "Purchase your first upgrade",
            reward: 1000
        },
        socialMediaStar: {
            name: "Going Viral",
            description: "Reach 1000 social media followers",
            reward: 2000
        },
        milestone100k: {
            name: "Six Figures",
            description: "Reach $100,000 cash on hand",
            reward: 2500,
            cashThreshold: 100000
        },
        milestone500k: {
            name: "Half a Million",
            description: "Reach $500,000 cash on hand",
            reward: 10000,
            cashThreshold: 500000
        },
        milestone1m: {
            name: "Seven Figures",
            description: "Reach $1,000,000 cash on hand",
            reward: 25000,
            cashThreshold: 1000000
        },
        milestone5m: {
            name: "Empire in Motion",
            description: "Reach $5,000,000 cash on hand",
            reward: 100000,
            cashThreshold: 5000000
        },
        millionaire: {
            name: "Millionaire",
            description: "Reach $1,000,000 in total earnings",
            reward: 10000
        },
        // Reputation tier achievements — flavor rewards that confirm
        // milestones the player can already feel from the tier badge.
        repLocalSpot: {
            name: "Local Spot",
            description: "Earn a reputation people start to recognize",
            reward: 500,
            reputationThreshold: 25,
        },
        repBuzzing: {
            name: "Buzzing",
            description: "Reach Buzzing — the line forms itself now",
            reward: 1500,
            reputationThreshold: 75,
        },
        repHotSpot: {
            name: "Hot Spot",
            description: "Become the place to eat in this part of town",
            reward: 4000,
            reputationThreshold: 200,
        },
        repIconic: {
            name: "Iconic",
            description: "Reach Iconic status — you are the brand",
            reward: 10000,
            reputationThreshold: 500,
        },
    };

    // Utility methods
    static getLocationByName(name) {
        return this.locations.find(loc => loc.name === name);
    }

    static getEmployeeType(type) {
        return this.employeeTypes[type] || null;
    }

    static getUpgradeType(type) {
        return this.upgradeTypes[type] || null;
    }

    // Contextual guards — patterns that imply a specific day shape
    // (a line, an empty room, a returning regular). When the day's state
    // doesn't match, the line is dropped from the candidate pool. Falls back
    // to the unguarded pool if every candidate would be filtered, so we never
    // end up with nothing to surface. Add new guards here as they're noticed.
    static messageGuards = [
        // Crowd / line / "rush hour" / "20 minutes" — only fits on busy days
        // or when there's enough traffic for a line to plausibly form.
        // Without this, a 1-walkup day surfaces "Line was longer than I had
        // time for," which reads broken.
        {
            match: /\bline\b|\bcrowd(?:ed)?\b|\bpacked\b|\bconveyor\b|\brush hour\b|\baround the block\b|\b\d+ minutes\b|\bstaffed for\b|\blooked busy\b/i,
            requires: ctx => ctx.busy === true || (ctx.customers || 0) >= 6,
        },
        // Empty-room implications — "nobody was here", "dead atmosphere".
        // Filter out when there's actually a crowd on (defense in depth on
        // top of the bucket-level slow gate).
        {
            match: /\bnobody\b|\bdead\b|\bstill open\b|\bquestion ordering\b|\bmarket more\b/i,
            requires: ctx => ctx.slow === true || (ctx.customers || 0) < 10,
        },
        // "Last time" / "remembered my order" — implies prior visits the
        // player hasn't earned yet. Hold these back until past opening week.
        {
            match: /\blast time\b|\bremembered my\b/i,
            requires: ctx => (ctx.day || 1) >= 5,
        },
    ];

    static passesGuards(message, context = {}) {
        const m = message.toLowerCase();
        for (const guard of this.messageGuards) {
            if (guard.match.test(m) && !guard.requires(context)) return false;
        }
        return true;
    }

    // Build a candidate pool from 'general' + context-specific buckets,
    // then pick one weighted by (1 - fixProgress). When `state` is provided,
    // negative messages whose suggested fix is already in progress get a
    // proportionally lower selection weight — fully-addressed complaints
    // effectively retire (small floor still lets a tragic edge case slip
    // through). Special context flags override the bucket set:
    //   - context.ambientOnly  → positive bucket = ambient (used for easy-mode
    //     zero-sales days where only walkers are present).
    //   - context.walkedAway   → negative pool is walkedAway only (drawn from
    //     when the bubble represents a non-buyer's exit comment).
    static getContextualFeedback(positive, context = {}, lastShown = '', state = null) {
        const pools = positive ? this.positiveFeedback : this.negativeFeedback;
        let buckets = ['general'];

        if (positive) {
            if (context.ambientOnly) {
                buckets = ['ambient'];
            } else {
                if (context.viral) buckets.push('viral');
                if (context.busy) buckets.push('busy');
                // Can't please everyone — simple recipes draw both love and "too plain" takes.
                if (context.simple) buckets.push('simpleLovers', 'simpleLovers');
                if (context.loaded) buckets.push('loadedLovers', 'loadedLovers');
                if (context.rivalDominant) buckets.push('rivalWin');
            }
        } else {
            if (context.walkedAway) {
                buckets = ['walkedAway'];
            } else {
                // Vague non-actionable mild dislikes always live alongside
                // general — sometimes people just don't click with a place
                // and there's no specific lever to point at.
                buckets.push('vague');
                if (context.supplyShortage) buckets.push('supplyShortage');
                if (context.busy) buckets.push('busy');
                if (context.slow) buckets.push('slow');
                if (context.simple) buckets.push('simpleDetractors', 'simpleDetractors');
                if (context.loaded) buckets.push('loadedDetractors', 'loadedDetractors');
                if (context.rivalPressure) buckets.push('rival');
            }
        }

        if (!context.ambientOnly && !context.walkedAway) {
            if (context.customerType && pools[context.customerType]) {
                buckets.push(context.customerType);
            }
            if (context.foodType && pools[context.foodType]) {
                buckets.push(context.foodType);
            }
        }

        let candidates = buckets.flatMap(b => pools[b] || []);

        // Addon-specific reactions — only fire for toppings actually in the
        // player's active recipe, so a pepperoni-and-parmesan pizza draws
        // different chatter than a basil-only one. Skipped for ambient/
        // walked-away context since those voices never tasted the food.
        if (!context.ambientOnly && !context.walkedAway && state) {
            const recipe = state.setup?.recipe || [];
            recipe.forEach(key => {
                const af = this.addonFeedback[key];
                const lines = af && af[positive ? 'positive' : 'negative'];
                if (lines && lines.length) candidates = candidates.concat(lines);
            });
        }

        const filtered = candidates.filter(m => m !== lastShown);
        let finalPool = filtered.length > 0 ? filtered : candidates;
        // Drop lines that don't fit the day's shape (a line at 1 customer,
        // "nobody was here" on a packed day, etc.). Fall back to unguarded
        // pool if everything would be filtered.
        const guarded = finalPool.filter(m => this.passesGuards(m, context));
        if (guarded.length > 0) finalPool = guarded;
        if (finalPool.length === 0) return '';

        // Positive selection is uniform; negatives are weighted by (1 - progress).
        if (positive || !state) {
            return finalPool[Math.floor(Math.random() * finalPool.length)];
        }

        const weights = finalPool.map(m => Math.max(0.05, 1 - this.computeFixProgress(m, state)));
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        for (let i = 0; i < finalPool.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return finalPool[i];
        }
        return finalPool[finalPool.length - 1];
    }

    // Legacy signature — kept for anything still calling it flat.
    static getRandomFeedback(positive = true) {
        return this.getContextualFeedback(positive);
    }

    static getReportHeading(day, lastHeading = '') {
        const filtered = this.reportHeadings.filter(h => h !== lastHeading);
        const pool = filtered.length > 0 ? filtered : this.reportHeadings;
        const template = pool[Math.floor(Math.random() * pool.length)];
        return template.replace('{day}', day);
    }

    static getEventMessage(eventType, lastMessage = '') {
        const variants = this.eventMessages[eventType] || [];
        if (variants.length === 0) return '';
        const filtered = variants.filter(m => m !== lastMessage);
        const pool = filtered.length > 0 ? filtered : variants;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Parallel-stack progress: combine independent partial fixes.
    // Two levers each at 0.5 stack to 0.75 (1 - 0.5*0.5), not 1.0.
    static stackProgress(...progresses) {
        return 1 - progresses.reduce((acc, p) => acc * (1 - (p || 0)), 1);
    }

    // --- Lever progress helpers ----------------------------------------------
    // Each returns 0..1 indicating how far along that lever is.
    // Cook / cashier helpers now read employee.level — a trained L3 cook
    // contributes nearly twice the wait-time fix progress of a fresh L1 hire.
    static _cookProgress(s) {
        const cooks = (s.employees || []).filter(e => e.type === 'cook');
        if (cooks.length === 0) return 0;
        // Per-cook contribution: 0.4 base × level multiplier.
        // L1 = 0.40, L2 = 0.60, L3 = 0.80. Stack across cooks via parallel.
        return GameData.stackProgress(...cooks.map(c =>
            0.4 * GameData.getEmployeeBenefitMultiplier(c)));
    }

    static _cashierProgress(s) {
        const cashiers = (s.employees || []).filter(e => e.type === 'cashier');
        if (cashiers.length === 0) return 0;
        // L1 = 0.6, L2 = 0.9, L3 = 1.2 (capped at 1.0 by the helper consumer).
        const best = Math.max(...cashiers.map(c =>
            0.6 * GameData.getEmployeeBenefitMultiplier(c)));
        return Math.min(1.0, best);
    }

    static _employeeCountProgress(s) {
        const employees = s.employees || [];
        if (employees.length === 0) return 0;
        // Stack each employee's training-weighted contribution. A team of
        // three L1s and a team with one L3 read about the same — hire OR
        // train.
        return GameData.stackProgress(...employees.map(e =>
            0.3 * GameData.getEmployeeBenefitMultiplier(e)));
    }

    static _marketingProgress(s) {
        const m = s.marketing || {};
        return GameData.stackProgress(
            m.hasCameraSetup     ? 0.3 : 0,
            m.hasSocialMediaAds  ? 0.4 : 0,
            m.hasInfluencerCollab ? 0.3 : 0,
        );
    }

    static _premiumProgress(s, key) {
        const tiers = s.setup?.supplierTiers || {};
        return tiers[key] === 'premium' ? 0.8 : 0;
    }

    static _anyPremiumProgress(s) {
        const tiers = s.setup?.supplierTiers || {};
        return Math.max(0, ...['bread','vegetables','meat','cheese']
            .map(k => tiers[k] === 'premium' ? 0.6 : 0));
    }

    static _vegAddonProgress(s) {
        const recipe = s.setup?.recipe || [];
        const veg = ['lettuce','tomato','mushrooms','onions','pickles','jalapenos',
            'spicyPeppers','basil','cilantro','avocado'];
        const count = recipe.filter(k => veg.includes(k)).length;
        if (count === 0) return 0;
        if (count === 1) return 0.5;
        return 1.0;
    }

    static _anyAddonProgress(s, perAddon = 0.4) {
        const recipe = s.setup?.recipe || [];
        const count = recipe.filter(k => GameData.recipeAddons[k]).length;
        return Math.min(1, count * perAddon);
    }

    // Map a negative-feedback string to an actionable hint that points at an
    // existing game lever. Lookup is keyword-based so string-only feedback
    // data stays simple. `fixProgress(state)` returns 0..1 — the share of the
    // suggested fix the player has already done. Selection is weighted by
    // (1 - progress), so partially-fixed complaints appear less often, and
    // fully-fixed ones effectively retire (small floor lets occasional gripes
    // still slip through — even great trucks get the rare bad take).
    static fixHints = [
        // Slow service, wait time, rushed feel, busy-day staffing complaints.
        // Cook + kitchen equipment are the main levers; cashier helps throughput.
        {
            match: /\bwait\b|\bslow\b|\bslower\b|\bfaster\b|\brushed\b|\blunch window\b|\bcrowd\b|\bline\b|\bstaff\b|\bconveyor\b|\b30 minutes\b|\b20 minutes\b/,
            text: 'Hire a Cook or buy Better Kitchen Equipment',
            fixProgress: s => GameData.stackProgress(
                GameData._cookProgress(s),
                s.upgrades?.kitchenEquipment ? 0.4 : 0,
                GameData._cashierProgress(s) * 0.4,
            ),
        },
        // Seating
        {
            match: /\bseat(?:ing)?\b/,
            text: 'Upgrade Seating on the Upgrades tab',
            fixProgress: s => s.upgrades?.seating ? 1.0 : 0,
        },
        // Music / atmosphere / dead room
        {
            match: /\bmusic\b|\batmosphere\b|\bambiance\b|\bambience\b/,
            text: 'Install a Sound System',
            fixProgress: s => s.upgrades?.soundSystem ? 1.0 : 0,
        },
        // "Place is dead" / "market more" — slow-bucket marketing complaints.
        // Reputation tier and marketing options stack: an Iconic-rep truck
        // can't credibly be "dead" even with no marketing spend, and a
        // fully-marketed Unknown truck still gets the complaint until it
        // earns reputation.
        {
            match: /\bnobody\b|\bstill open\b|\bmarket more\b|\bdead\b|\bquestion ordering\b/,
            text: 'Try social media — Camera Setup or Social Media Ads',
            fixProgress: s => GameData.stackProgress(
                GameData._marketingProgress(s),
                GameData._reputationProgress(s),
            ),
        },
        // Bread-specific quality complaints — pizza crust, sandwich bread, bun.
        {
            match: /\bbread\b|\bcrust\b|\bbun\b|\bsoggy\b|\btortilla\b|\bdough\b/,
            text: 'Try Premium Bread on the Suppliers tab',
            fixProgress: s => GameData._premiumProgress(s, 'bread'),
        },
        // Cheese / dairy / sauce complaints
        {
            match: /\bcheese\b|\bmelted\b|\bmayo\b|\bdairy\b/,
            text: 'Try Premium Dairy on the Suppliers tab',
            fixProgress: s => GameData._premiumProgress(s, 'cheese'),
        },
        // Produce / vegetable freshness
        {
            match: /\bproduce\b|\bvegetable\b|\bsad\b/,
            text: 'Try Premium Vegetables on the Suppliers tab',
            fixProgress: s => GameData._premiumProgress(s, 'vegetables'),
        },
        // Generic freshness — any premium helps a bit.
        {
            match: /\bstale\b|\bfresh\b|\bfrozen\b|\boff\b/,
            text: 'Try Premium suppliers once you have the trust',
            fixProgress: s => GameData._anyPremiumProgress(s),
        },
        // Out of stock — no clear progress signal beyond "buy more". Hint
        // always shows; selection isn't weighted down (player needs the nudge).
        {
            match: /\bran out\b|\bout of\b|\bempty\b/,
            text: 'Stock more inventory on the Suppliers tab',
            fixProgress: s => 0,
        },
        // Seasoning / bland — any topping helps; food-specific ones (sauce,
        // jalapeños, bacon, parmesan, sour cream...) all count via the same
        // any-addon helper used elsewhere.
        {
            match: /\bseason(?:ing)?\b|\bflavor\b|\bbland\b/,
            text: 'Add a topping on the Recipe tab',
            fixProgress: s => GameData._anyAddonProgress(s, 0.5),
        },
        // Special / memorable / unique / highlight — tourist/menu complaints.
        // Any addons help; first one matters most.
        {
            match: /\bspecial\b|\bmemorable\b|\bunique\b|\bhighlight\b/,
            text: 'Add toppings to make it stand out',
            fixProgress: s => GameData._anyAddonProgress(s, 0.5),
        },
        // Vegetarian options — needs a veg addon specifically, not bacon.
        {
            match: /\bvegetarian\b/,
            text: 'Add a veg topping (lettuce, tomato, mushrooms) on the Recipe tab',
            fixProgress: s => GameData._vegAddonProgress(s),
        },
        // Menu limited
        {
            match: /\bmenu\b|\blimited\b/,
            text: 'Expand with toppings on the Recipe tab',
            fixProgress: s => GameData._anyAddonProgress(s, 0.4),
        },
        // Price / portion / value — meal mode and lower price both help.
        {
            match: /\bprice\b|\bportion\b|\bbudget\b|\bcheap\b|\bexpensive\b|\bpricey\b|\bvalue\b/,
            text: 'Adjust menu price or try Meal deal for better value',
            fixProgress: s => GameData.stackProgress(
                s.setup?.mealMode ? 0.5 : 0,
                (s.setup?.priceMultiplier || 1.0) <= 1.0 ? 0.5 : 0,
            ),
        },
        // Quick / combo
        {
            match: /\bquick\b|\bcombo\b/,
            text: 'Turn on Meal deal on the Recipe tab',
            fixProgress: s => s.setup?.mealMode ? 1.0 : 0,
        },
        // Order accuracy
        {
            match: /\border right\b|\border wrong\b|\btwo tries\b/,
            text: 'Hire a Cashier to improve order accuracy',
            fixProgress: s => GameData._cashierProgress(s),
        },
        // Filling / portion-feel
        {
            match: /\bfilling\b|\bsmall\b|\bgenerous\b|\bsize\b/,
            text: 'Add toppings to beef up each sale',
            fixProgress: s => GameData._anyAddonProgress(s, 0.4),
        },
        // Toppings light / not enough toppings
        {
            match: /\btopping(?:s)?\b/,
            text: 'Add more toppings on the Recipe tab',
            fixProgress: s => GameData._anyAddonProgress(s, 0.3),
        },
    ];

    // Compute the fix-progress for a message: the max progress across any
    // matching rule. Returns 0 if nothing matches.
    static computeFixProgress(message, state) {
        if (!state) return 0;
        const m = message.toLowerCase();
        let max = 0;
        for (const rule of this.fixHints) {
            if (rule.match.test(m)) {
                const p = rule.fixProgress ? rule.fixProgress(state) : 0;
                if (p > max) max = p;
            }
        }
        return Math.min(1, Math.max(0, max));
    }

    // Returns { text, progress, redundant } when a hint matches, or null.
    // `redundant` is true when progress > 0.7 (close enough that the hint
    // would feel like nagging — UI suppresses the 💡 line at this point).
    static getFixHintInfo(message, state = null) {
        const m = message.toLowerCase();
        const hit = this.fixHints.find(h => h.match.test(m));
        if (!hit) return null;
        const progress = state && hit.fixProgress ? hit.fixProgress(state) : 0;
        return { text: hit.text, progress, redundant: progress > 0.7 };
    }

    // Legacy text-only signature.
    static getFixHint(message) {
        const info = this.getFixHintInfo(message);
        return info ? info.text : null;
    }

    static getFoodTypeData(foodType) {
        return this.foodTypes[foodType] || null;
    }

    static getDifficultySettings(difficulty) {
        return this.difficultySettings[difficulty] || this.difficultySettings.normal;
    }

    // Get available employee types for current business type
    static getAvailableEmployeeTypes(businessType = 'foodTruck') {
        const availableTypes = {};
        Object.entries(this.employeeTypes).forEach(([key, employee]) => {
            if (employee.businessTypes.includes(businessType)) {
                availableTypes[key] = employee;
            }
        });
        return availableTypes;
    }

    // Check if can hire more of a specific employee type
    static canHireEmployee(employeeType, currentEmployees, businessType = 'foodTruck') {
        const empData = this.getEmployeeType(employeeType);
        if (!empData || !empData.businessTypes.includes(businessType)) {
            return false;
        }

        const currentCount = currentEmployees.filter(emp => emp.type === employeeType).length;
        const maxCount = empData.maxCount[businessType] || 0;
        
        return currentCount < maxCount;
    }

    // Get current employee count by type
    static getEmployeeCount(employeeType, currentEmployees) {
        return currentEmployees.filter(emp => emp.type === employeeType).length;
    }
}

// Export for module usage
window.GameData = GameData;