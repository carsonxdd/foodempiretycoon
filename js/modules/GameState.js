/**
 * GameState Module - Central game state management
 */
class GameState {
    constructor() {
        this.observers = [];
        this.state = {
            money: 10000,
            totalEarnings: 0,
            reputation: 0,
            day: 1,
            employees: [],
            marketing: {
                hasCameraSetup: false,
                hasSocialMediaAds: false,
                hasInfluencerCollab: false,
                followers: 0,
                lastViralBonus: 0,
                viralCooldown: 0
            },
            upgrades: {
                kitchenEquipment: false,
                seating: false,
                soundSystem: false,
                fridgeUpgrade: false
            },
            setup: {
                businessName: '',
                foodType: '',
                location: null,
                difficulty: 'normal',
                priceMultiplier: 1.0,
                recipe: ['bread', 'vegetables', 'meat', 'cheese'],
                mealMode: false,
                supplierTiers: {
                    bread: 'basic', vegetables: 'basic', meat: 'basic', cheese: 'basic',
                    drinks: 'basic', sides: 'basic'
                }
            },
            business: {
                type: 'foodTruck',
                level: 1
            },
            inventory: {
                bread: 0, vegetables: 0, meat: 0, cheese: 0,
                drinks: 0, sides: 0
            },
            marketPrices: {
                bread: 1.0, vegetables: 1.0, meat: 1.0, cheese: 1.0,
                drinks: 1.0, sides: 1.0
            },
            supplierOrders: {
                bread: 0, vegetables: 0, meat: 0, cheese: 0,
                drinks: 0, sides: 0
            },
            regulars: 0,
            history: [],
            newsFeed: [],
            regularCustomers: [],
            healthInspector: { lastVisitDay: null },
            rivalTruck: { name: GameData.getRandomRivalName(), momentum: 50 }
        };
    }

    // State getters
    get money() { return this.state.money; }
    get totalEarnings() { return this.state.totalEarnings; }
    get reputation() { return this.state.reputation; }
    get day() { return this.state.day; }
    get employees() { return this.state.employees; }
    get marketing() { return this.state.marketing; }
    get upgrades() { return this.state.upgrades; }
    get setup() { return this.state.setup; }
    get business() { return this.state.business; }
    get inventory() { return this.state.inventory; }
    get marketPrices() { return this.state.marketPrices; }
    get supplierOrders() { return this.state.supplierOrders; }
    get regulars() { return this.state.regulars; }
    get history() { return this.state.history || []; }
    get newsFeed() { return this.state.newsFeed || []; }
    get regularCustomers() { return this.state.regularCustomers || []; }
    get healthInspector() { return this.state.healthInspector || { lastVisitDay: null }; }
    get rivalTruck() { return this.state.rivalTruck || { name: 'A rival truck', momentum: 50 }; }

    addHistoryEntry(entry) {
        if (!this.state.history) this.state.history = [];
        this.state.history.push(entry);
        this.notifyObservers('history', this.state.history);
    }

    addNewsEntry(entry) {
        if (!Array.isArray(this.state.newsFeed)) this.state.newsFeed = [];
        this.state.newsFeed.push(entry);
        if (this.state.newsFeed.length > 20) this.state.newsFeed.shift();
        this.notifyObservers('newsFeed', this.state.newsFeed);
    }

    addRegularCustomer(entry) {
        if (!Array.isArray(this.state.regularCustomers)) this.state.regularCustomers = [];
        this.state.regularCustomers.push(entry);
        this.notifyObservers('regularCustomers', this.state.regularCustomers);
    }

    incrementRegularVisit(name) {
        const regular = (this.state.regularCustomers || []).find(r => r.name === name);
        if (!regular) return;
        regular.visits = (regular.visits || 0) + 1;
        this.notifyObservers('regularCustomers', this.state.regularCustomers);
    }

    setHealthInspectorVisit(day) {
        if (!this.state.healthInspector) this.state.healthInspector = { lastVisitDay: null };
        this.state.healthInspector.lastVisitDay = day;
        this.notifyObservers('healthInspector', this.state.healthInspector);
    }

    setRivalMomentum(momentum) {
        if (!this.state.rivalTruck) this.state.rivalTruck = { name: GameData.getRandomRivalName(), momentum: 50 };
        this.state.rivalTruck.momentum = Math.max(0, Math.min(100, momentum));
        this.notifyObservers('rivalTruck', this.state.rivalTruck);
    }

    incrementSupplierOrders(type) {
        if (!this.state.supplierOrders) this.state.supplierOrders = {};
        this.state.supplierOrders[type] = (this.state.supplierOrders[type] || 0) + 1;
        this.notifyObservers('supplierOrders', this.state.supplierOrders);
    }

    setMarketPrices(prices) {
        this.state.marketPrices = prices;
        this.notifyObservers('marketPrices', this.state.marketPrices);
    }

    setRegulars(count) {
        this.state.regulars = Math.max(0, count);
        this.notifyObservers('regulars', this.state.regulars);
    }

    // State setters
    setMoney(amount) {
        // Round to the nearest cent so repeated fractional charges (daily
        // overhead is charged as a fraction of the monthly total) don't
        // accumulate into floating-point noise like 5813.333333333333.
        this.state.money = Math.max(0, Math.round(amount * 100) / 100);
        this.notifyObservers('money', this.state.money);
    }

    addMoney(amount) {
        // Track positive earnings for achievement system
        if (amount > 0) {
            this.state.totalEarnings += amount;
            this.notifyObservers('totalEarnings', this.state.totalEarnings);
        }
        this.setMoney(this.state.money + amount);
    }

    subtractMoney(amount) {
        return this.spendMoney(amount);
    }

    spendMoney(amount) {
        if (this.state.money >= amount) {
            this.setMoney(this.state.money - amount);
            return true;
        }
        return false;
    }

    setReputation(amount) {
        this.state.reputation = Math.max(0, amount);
        this.notifyObservers('reputation', this.state.reputation);
    }

    addReputation(amount) {
        this.setReputation(this.state.reputation + amount);
    }

    nextDay() {
        this.state.day++;
        this.notifyObservers('day', this.state.day);
    }

    // Employee management
    addEmployee(employee) {
        // Default level/training fields so old call sites keep working.
        const emp = {
            level: 1,
            training: null,
            ...employee,
        };
        this.state.employees.push(emp);
        this.notifyObservers('employees', this.state.employees);
    }

    removeEmployee(index) {
        this.state.employees.splice(index, 1);
        this.notifyObservers('employees', this.state.employees);
    }

    // Start training an employee toward a target level. Caller is responsible
    // for charging the cost and validating eligibility (BusinessLogic does this).
    startEmployeeTraining(index, targetLevel, startDay) {
        const emp = this.state.employees[index];
        if (!emp) return false;
        emp.training = { startDay, targetLevel };
        this.notifyObservers('employees', this.state.employees);
        return true;
    }

    // Complete a pending training: bump level, clear flag.
    completeEmployeeTraining(index) {
        const emp = this.state.employees[index];
        if (!emp || !emp.training) return false;
        emp.level = emp.training.targetLevel;
        emp.training = null;
        this.notifyObservers('employees', this.state.employees);
        return true;
    }

    // Marketing management
    purchaseMarketing(type) {
        switch(type) {
            case 'cameraSetup':
                this.state.marketing.hasCameraSetup = true;
                break;
            case 'socialMediaAds':
                this.state.marketing.hasSocialMediaAds = true;
                break;
            case 'influencerCollab':
                this.state.marketing.hasInfluencerCollab = true;
                // One-time follower boost from influencer
                this.state.marketing.followers += 100;
                break;
        }
        this.notifyObservers('marketing', this.state.marketing);
    }

    addFollowers(amount) {
        this.state.marketing.followers += amount;
        this.notifyObservers('marketing', this.state.marketing);
    }

    // Upgrade management
    purchaseUpgrade(type) {
        if (this.state.upgrades.hasOwnProperty(type)) {
            this.state.upgrades[type] = true;
            this.notifyObservers('upgrades', this.state.upgrades);
            return true;
        }
        return false;
    }

    // Business progression
    upgradeBusiness(newType) {
        const levels = { foodTruck: 1, restaurant: 2, chain: 3 };
        this.state.business.type = newType;
        this.state.business.level = levels[newType] || 1;
        this.notifyObservers('business', this.state.business);
    }

    // Setup management
    updateSetup(field, value) {
        this.state.setup[field] = value;
        this.notifyObservers('setup', this.state.setup);
    }

    // Inventory management
    addInventory(type, amount) {
        if (this.state.inventory.hasOwnProperty(type)) {
            this.state.inventory[type] += amount;
            this.notifyObservers('inventory', this.state.inventory);
        }
    }

    useInventory(type, amount) {
        if (this.state.inventory.hasOwnProperty(type) && this.state.inventory[type] >= amount) {
            this.state.inventory[type] -= amount;
            this.notifyObservers('inventory', this.state.inventory);
            return true;
        }
        return false;
    }

    // Save/Load functionality
    save() {
        try {
            localStorage.setItem('foodEmpireGameState', JSON.stringify(this.state));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    load() {
        try {
            const savedState = localStorage.getItem('foodEmpireGameState');
            if (savedState) {
                this.state = { ...this.state, ...JSON.parse(savedState) };
                // Backfill fields added in later versions so old saves keep working.
                if (Array.isArray(this.state.employees)) {
                    this.state.employees.forEach(e => {
                        if (e.level === undefined) e.level = 1;
                        if (e.training === undefined) e.training = null;
                    });
                }
                if (!Array.isArray(this.state.newsFeed)) this.state.newsFeed = [];
                if (!Array.isArray(this.state.regularCustomers)) this.state.regularCustomers = [];
                if (!this.state.healthInspector) this.state.healthInspector = { lastVisitDay: null };
                if (!this.state.rivalTruck) this.state.rivalTruck = { name: GameData.getRandomRivalName(), momentum: 50 };
                this.notifyObservers('load', this.state);
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return false;
    }

    reset() {
        this.state = {
            money: 10000,
            totalEarnings: 0,
            reputation: 0,
            day: 1,
            employees: [],
            marketing: {
                hasCameraSetup: false,
                hasSocialMediaAds: false,
                hasInfluencerCollab: false,
                followers: 0,
                lastViralBonus: 0,
                viralCooldown: 0
            },
            upgrades: {
                kitchenEquipment: false,
                seating: false,
                soundSystem: false,
                fridgeUpgrade: false
            },
            setup: {
                businessName: '',
                foodType: '',
                location: null,
                difficulty: 'normal',
                priceMultiplier: 1.0,
                recipe: ['bread', 'vegetables', 'meat', 'cheese'],
                mealMode: false,
                supplierTiers: {
                    bread: 'basic', vegetables: 'basic', meat: 'basic', cheese: 'basic',
                    drinks: 'basic', sides: 'basic'
                }
            },
            business: {
                type: 'foodTruck',
                level: 1
            },
            inventory: {
                bread: 0, vegetables: 0, meat: 0, cheese: 0,
                drinks: 0, sides: 0
            },
            marketPrices: {
                bread: 1.0, vegetables: 1.0, meat: 1.0, cheese: 1.0,
                drinks: 1.0, sides: 1.0
            },
            supplierOrders: {
                bread: 0, vegetables: 0, meat: 0, cheese: 0,
                drinks: 0, sides: 0
            },
            regulars: 0,
            history: [],
            newsFeed: [],
            regularCustomers: [],
            healthInspector: { lastVisitDay: null },
            rivalTruck: { name: GameData.getRandomRivalName(), momentum: 50 }
        };
        this.notifyObservers('reset', this.state);
    }

    // Observer pattern for UI updates
    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers(type, data) {
        this.observers.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }

    // Get full state (for debugging or advanced operations)
    getFullState() {
        return { ...this.state };
    }
}

// Export for module usage
window.GameState = GameState;