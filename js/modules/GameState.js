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
            history: []
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

    addHistoryEntry(entry) {
        if (!this.state.history) this.state.history = [];
        this.state.history.push(entry);
        this.notifyObservers('history', this.state.history);
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
        this.state.money = Math.max(0, amount);
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
        this.state.employees.push(employee);
        this.notifyObservers('employees', this.state.employees);
    }

    removeEmployee(index) {
        this.state.employees.splice(index, 1);
        this.notifyObservers('employees', this.state.employees);
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
            history: []
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