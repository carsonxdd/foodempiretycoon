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
                rentCost: 1800
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
                rentCost: 1300
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
                rentCost: 2500
            }
        }
    ];

    static employeeTypes = {
        cook: {
            name: 'Cook',
            salary: 1800,
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
            salary: 1200,
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
            salary: 3000,
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
            salary: 1500,
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
            salary: 2500,
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
    static supplierTypes = {
        bread: {
            name: 'Bread', icon: '🍞', basePrice: 15,
            description: 'Buns, tortillas, pizza dough, sandwich loaves',
            isCore: true,
        },
        vegetables: {
            name: 'Vegetables', icon: '🥬', basePrice: 12,
            description: 'Lettuce, tomatoes, onions, fresh toppings',
            isCore: true,
        },
        meat: {
            name: 'Meat', icon: '🥩', basePrice: 30,
            description: 'Beef, chicken, pork — the protein',
            isCore: true,
        },
        cheese: {
            name: 'Dairy', icon: '🧀', basePrice: 18,
            description: 'Cheese, butter, cream, sauce bases',
            isCore: true,
        },
        drinks: {
            name: 'Drinks', icon: '🥤', basePrice: 8,
            description: 'Soda, water, juice — part of the meal deal',
            isCore: false, isMeal: true,
        },
        sides: {
            name: 'Sides', icon: '🍟', basePrice: 10,
            description: 'Fries, chips, rice — completes the meal',
            isCore: false, isMeal: true,
        },
    };

    // Recipe addons — toggleable on the Recipe tab. Not suppliers; they consume
    // extra units of their parent category per sale.
    // e.g. adding Bacon means 2 meat per sale (1 for the base patty + 1 for bacon).
    static recipeAddons = {
        lettuce: {
            name: 'Lettuce', icon: '🥬', parent: 'vegetables', consumption: 1,
            description: 'Crisp and fresh — +1 veg/sale',
            priceBonus: 0.5, appealBonus: 0.015,
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
        },
        mushrooms: {
            name: 'Mushrooms', icon: '🍄', parent: 'vegetables', consumption: 1,
            description: 'Sautéed mushrooms — +1 veg/sale',
            priceBonus: 1.0, appealBonus: 0.02,
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
            customerMultiplier: 1.15,
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
            vehiclePayment:  450,   // monthly truck lease
            businessLicense: 150,
            foodPermit:      50,
            insurance:       200,
        },
        restaurant: {
            vehiclePayment:  0,     // sold the truck
            businessLicense: 300,
            foodPermit:      100,
            insurance:       400,
        },
        chain: {
            vehiclePayment:  0,
            businessLicense: 600,
            foodPermit:      200,
            insurance:       800,
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
        }
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

    // Build a candidate pool from 'general' + context-specific buckets,
    // then pick one that isn't the last-shown message (if possible).
    static getContextualFeedback(positive, context = {}, lastShown = '') {
        const pools = positive ? this.positiveFeedback : this.negativeFeedback;
        const buckets = ['general'];

        if (positive) {
            if (context.viral) buckets.push('viral');
            if (context.busy) buckets.push('busy');
            // Can't please everyone — simple recipes draw both love and "too plain" takes.
            if (context.simple) buckets.push('simpleLovers', 'simpleLovers');
            if (context.loaded) buckets.push('loadedLovers', 'loadedLovers');
        } else {
            if (context.supplyShortage) buckets.push('supplyShortage');
            if (context.busy) buckets.push('busy');
            if (context.slow) buckets.push('slow');
            if (context.simple) buckets.push('simpleDetractors', 'simpleDetractors');
            if (context.loaded) buckets.push('loadedDetractors', 'loadedDetractors');
        }

        if (context.customerType && pools[context.customerType]) {
            buckets.push(context.customerType);
        }
        if (context.foodType && pools[context.foodType]) {
            buckets.push(context.foodType);
        }

        const candidates = buckets.flatMap(b => pools[b] || []);
        const filtered = candidates.filter(m => m !== lastShown);
        const finalPool = filtered.length > 0 ? filtered : candidates;

        return finalPool[Math.floor(Math.random() * finalPool.length)];
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

    // Map a negative-feedback string to an actionable hint that points at an
    // existing game lever. Returns null if the comment is pure flavor.
    // The lookup is keyword-based so string-only feedback data stays simple.
    static getFixHint(message) {
        const m = message.toLowerCase();
        const hints = [
            { match: /\bwait\b|\bslow\b|\bslower\b|\bfaster\b|\brushed\b|\blunch window\b/,
              text: 'Hire a Cook or buy Better Kitchen Equipment' },
            { match: /\bseat(?:ing)?\b/,
              text: 'Upgrade Seating on the Upgrades tab' },
            { match: /\bmusic\b|\batmosphere\b|\bambiance\b|\bambience\b/,
              text: 'Install a Sound System' },
            { match: /\bstale\b|\bfresh\b|\bsad\b|\bfrozen\b|\boff\b|\bsoggy\b/,
              text: 'Try Premium suppliers once you have the trust' },
            { match: /\bran out\b|\bout of\b|\bempty\b/,
              text: 'Stock more inventory on the Suppliers tab' },
            { match: /\bseason(?:ing)?\b|\bflavor\b|\bbland\b|\bspecial\b|\bmemorable\b|\bunique\b/,
              text: 'Add a topping (sauce, bacon, jalapeños) on the Recipe tab' },
            { match: /\bportion\b|\bprice\b|\bbudget\b|\bcheap\b|\bexpensive\b|\bpricey\b|\bvalue\b/,
              text: 'Adjust menu price or try Meal deal for better value' },
            { match: /\bmenu\b|\blimited\b|\bvegetarian\b|\bhighlight\b/,
              text: 'Expand with toppings on the Recipe tab' },
            { match: /\bquick\b|\bcombo\b/,
              text: 'Turn on Meal deal on the Recipe tab' },
            { match: /\border right\b|\border wrong\b/,
              text: 'Hire a Cashier to improve order accuracy' },
            { match: /\bfilling\b|\bsmall\b|\bgenerous\b|\bsize\b/,
              text: 'Add toppings to beef up each sale' },
        ];
        const hit = hints.find(h => h.match.test(m));
        return hit ? hit.text : null;
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