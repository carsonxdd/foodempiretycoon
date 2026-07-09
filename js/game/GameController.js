/**
 * GameController Module - Main game controller and event coordinator
 */
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.businessLogic = new BusinessLogic(this.gameState);
        this.uiManager = new UIManager(this.gameState);
        // UIManager reads live economics via the same BusinessLogic instance.
        this.uiManager.businessLogic = this.businessLogic;
        this.soundManager = new SoundManager();
        // UIManager plays the page-flip cue directly from its own modal-nav handlers.
        this.uiManager.soundManager = this.soundManager;
        this.setupManager = new SetupManager(this.gameState, this.uiManager);
        this.tutorialManager = new TutorialManager(this.gameState, this.uiManager);
        
        this.initializeEventHandlers();
        this.setupAutoSave();
    }

    initializeEventHandlers() {
        // Next Day button
        const nextDayButton = document.getElementById('nextDay');
        if (nextDayButton) {
            nextDayButton.addEventListener('click', () => this.processNextDay());
        }

        // Employee hiring
        const hireEmployeeButton = document.getElementById('hireEmployee');
        if (hireEmployeeButton) {
            hireEmployeeButton.addEventListener('click', () => this.hireEmployee());
        }

        // Tab navigation
        const menuButtons = document.querySelectorAll('.menu-button');
        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.uiManager.switchTab(tabName);
                
                // Trigger tutorial event for tab changes
                this.triggerTutorialEvent('tabChanged:' + tabName);
            });
        });

        // Upgrade buttons - using event delegation for dynamically created buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('upgrade-button')) {
                const upgradeType = e.target.dataset.upgrade;
                this.purchaseUpgrade(upgradeType);
            }

            if (e.target.classList.contains('supplier-button') || e.target.classList.contains('supplier-buy')) {
                const supplierType = e.target.dataset.supplier;
                const row = e.target.closest('.supplier-row');
                const slider = row?.querySelector('.supplier-slider');
                const qty = slider ? parseInt(slider.value, 10) : 10;
                this.orderSupplies(supplierType, qty);
            }

            if (e.target.classList.contains('marketing-button')) {
                const marketingType = e.target.dataset.marketing;
                this.purchaseMarketing(marketingType);
            }

            if (e.target.classList.contains('progression-button')) {
                const progressionType = e.target.dataset.progression;
                this.upgradeBusiness(progressionType);
            }

            if (e.target.classList.contains('price-nudge')) {
                const dir = parseInt(e.target.dataset.dir, 10);
                this.nudgePrice(dir);
            }

            // Recipe ingredient toggle
            const ingredientEl = e.target.closest('.recipe-chip');
            if (ingredientEl && ingredientEl.dataset.ingredient) {
                this.toggleRecipeIngredient(ingredientEl.dataset.ingredient);
            }

            // Meal mode toggle
            const mealEl = e.target.closest('.meal-toggle');
            if (mealEl) {
                this.toggleMealMode();
            }

            // Supplier tier toggle
            const tierEl = e.target.closest('.supplier-tier-switch');
            if (tierEl && tierEl.dataset.supplier) {
                this.toggleSupplierTier(tierEl.dataset.supplier);
            }

            // Add-to-recipe quick action on supplier rows
            const addBtn = e.target.closest('[data-add-to-recipe]');
            if (addBtn) {
                const ing = addBtn.dataset.addToRecipe;
                this.toggleRecipeIngredient(ing);
                const supp = GameData.supplierTypes[ing];
                this.uiManager.showNotification(
                    `${supp.icon} ${supp.name} added to your recipe.`, 'success'
                );
            }
        });

        // Money display updates should trigger button state updates
        this.gameState.addObserver((type, data) => {
            if (type === 'money') {
                this.uiManager.updateButtonStates();
            }
        });

        // Save/Load/Restart/Tutorial buttons (if they exist)
        const saveButton = document.getElementById('saveGame');
        const loadButton = document.getElementById('loadGame');
        const restartButton = document.getElementById('restartGame');
        const tutorialButton = document.getElementById('showTutorial');
        
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveGame());
        }
        if (loadButton) {
            loadButton.addEventListener('click', () => this.loadGame());
        }
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restartGame());
        }
        if (tutorialButton) {
            tutorialButton.addEventListener('click', () => this.showTutorial());
        }

        // Sound toggle
        const soundButton = document.getElementById('soundToggle');
        if (soundButton) {
            this.updateSoundButton(soundButton);
            soundButton.addEventListener('click', () => {
                const enabled = this.soundManager.toggle();
                this.updateSoundButton(soundButton);
                if (enabled) this.soundManager.play('pageFlip');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    updateSoundButton(button) {
        const enabled = this.soundManager.isEnabled();
        button.textContent = enabled ? '🔊' : '🔇';
        button.title = enabled ? 'Sound on — click to mute' : 'Sound off — click to unmute';
    }

    processNextDay() {
        // Health inspector is a pre-day gate: if it fires, the day's business
        // processing pauses until the player picks a choice in the modal
        // (see resolveHealthInspectorChoice, which resumes via _runDayProcessing).
        if (this.checkHealthInspectorTrigger()) return;
        this._runDayProcessing();
    }

    checkHealthInspectorTrigger() {
        const cfg = GameData.healthInspectorEvent;
        const hi = this.gameState.healthInspector;
        if (this.gameState.day < cfg.minDay) return false;
        if (hi.lastVisitDay !== null && (this.gameState.day - hi.lastVisitDay) < cfg.cooldownDays) return false;
        if (Math.random() >= cfg.triggerChance) return false;

        this.uiManager.showHealthInspectorModal(cfg, (choiceId) => this.resolveHealthInspectorChoice(choiceId));
        return true;
    }

    resolveHealthInspectorChoice(choiceId) {
        const cfg = GameData.healthInspectorEvent;
        const choice = cfg.choices.find(c => c.id === choiceId) || cfg.choices[0];
        const businessType = this.gameState.business.type;
        let message = '';
        let icon = cfg.icon;

        if (choice.id === 'bribe') {
            const cost = choice.costByType[businessType];
            this.gameState.spendMoney(Math.min(cost, this.gameState.money));
            if (Math.random() < choice.catchChance) {
                const caughtCost = choice.caughtCostByType[businessType];
                this.gameState.spendMoney(Math.min(caughtCost, this.gameState.money));
                this.gameState.addReputation(choice.caughtRepPenalty);
                message = `The bribe didn't land well — word got out, and it cost you $${caughtCost} and some reputation.`;
                icon = '🚨';
            } else {
                message = `A little something under the table kept the visit quiet.`;
            }
        } else if (choice.id === 'dispute') {
            if (Math.random() < choice.successChance) {
                this.gameState.addReputation(choice.successRep);
                message = `The dispute actually worked — the findings got walked back.`;
            } else {
                this.gameState.addReputation(choice.failRep);
                message = `The dispute didn't go well — the violation stuck, and then some.`;
            }
        } else {
            const cost = choice.costByType[businessType];
            this.gameState.spendMoney(Math.min(cost, this.gameState.money));
            message = `Paid $${cost} to fix things up before the inspector left — clean record.`;
        }

        this.gameState.setHealthInspectorVisit(this.gameState.day);
        this.gameState.addNewsEntry({ day: this.gameState.day, icon, message });
        this.uiManager.showNotification(message, icon === '🚨' ? 'error' : 'info');

        this._runDayProcessing();
    }

    _runDayProcessing() {
        try {
            // Process daily business operations
            const businessResults = this.businessLogic.processDailyBusiness();

            // Update UI with results
            this.uiManager.updateDailySummary(businessResults);

            if (businessResults.revenue.actualSales > 0) {
                this.soundManager.play('sale');
            }

            // A viral hit today feeds the news ticker.
            if (this.gameState.marketing.lastViralBonus > 0) {
                this.gameState.addNewsEntry({
                    day: this.gameState.day,
                    icon: '📱',
                    message: GameData.getNewsLine(GameData.newsTemplates.viral, this.gameState.setup.businessName)
                });
            }

            // A new named regular joined the cast today.
            if (businessResults.newRegular) {
                this.uiManager.showNotification(
                    `${businessResults.newRegular.name} is becoming a regular!`,
                    'success'
                );
            }

            // Rival truck momentum crossed a threshold today.
            if (businessResults.rivalShift) {
                this.gameState.addNewsEntry({
                    day: this.gameState.day,
                    icon: '🥊',
                    message: GameData.getNewsLine(GameData.newsTemplates[businessResults.rivalShift], this.gameState.setup.businessName)
                });
            }

            // Check for achievements
            this.checkAchievements();
            
            // Check for game over conditions
            this.checkGameOver();
            
            // Auto-save after each day
            this.autoSave();
            
        } catch (error) {
            console.error('Error processing next day:', error);
            this.uiManager.showNotification('Error processing day. Please try again.', 'error');
        }
    }

    hireEmployee() {
        const employeeTypeSelect = document.getElementById('employeeType');
        if (!employeeTypeSelect) return;

        const selectedType = employeeTypeSelect.value;
        const result = this.businessLogic.purchaseEmployee(selectedType);

        if (result.success) {
            this.uiManager.showNotification(result.message, 'success');
            this.triggerTutorialEvent('employeeHired');
        } else {
            this.uiManager.showNotification(result.message, 'error');
        }
    }

    // Pay to train an employee toward their next level. Cost charged up
    // front; the level-up lands after the configured number of days.
    trainEmployee(employeeIndex) {
        const result = this.businessLogic.purchaseEmployeeTraining(employeeIndex);
        if (result.success) {
            this.uiManager.showNotification(result.message, 'success');
        } else {
            this.uiManager.showNotification(result.message, 'error');
        }
    }

    purchaseUpgrade(upgradeType) {
        const upgradeData = GameData.getUpgradeType(upgradeType);
        
        if (!upgradeData) {
            this.uiManager.showNotification('Invalid upgrade type.', 'error');
            return;
        }

        if (this.gameState.upgrades[upgradeType]) {
            this.uiManager.showNotification('You already own this upgrade.', 'info');
            return;
        }

        const confirmPurchase = this.uiManager.showConfirmation(
            `Purchase ${upgradeData.name} for $${upgradeData.cost.toLocaleString()}?`
        );

        if (confirmPurchase && this.businessLogic.purchaseUpgrade(upgradeType)) {
            this.uiManager.showNotification(`Successfully purchased ${upgradeData.name}!`, 'success');
        } else if (confirmPurchase) {
            this.uiManager.showNotification(`Not enough money for ${upgradeData.name}. Need $${upgradeData.cost.toLocaleString()}.`, 'error');
        }
    }

    purchaseMarketing(marketingType = 'cameraSetup') {
        const marketingData = GameData.marketingOptions[marketingType];

        if (!marketingData) {
            this.uiManager.showNotification('Invalid marketing option.', 'error');
            return;
        }

        // Check if already owned
        const marketing = this.gameState.marketing;
        if (marketingType === 'cameraSetup' && marketing.hasCameraSetup) {
            this.uiManager.showNotification('You already have the camera setup!', 'info');
            return;
        }
        if (marketingType === 'socialMediaAds' && marketing.hasSocialMediaAds) {
            this.uiManager.showNotification('You already have social media ads running!', 'info');
            return;
        }
        if (marketingType === 'influencerCollab' && marketing.hasInfluencerCollab) {
            this.uiManager.showNotification('You already collaborated with an influencer!', 'info');
            return;
        }

        // Camera setup is required for other marketing options
        if (marketingType !== 'cameraSetup' && !marketing.hasCameraSetup) {
            this.uiManager.showNotification('You need Camera Setup first before other marketing options!', 'error');
            return;
        }

        const costLabel = marketingData.recurring ? `$${marketingData.cost}/month` : `$${marketingData.cost.toLocaleString()}`;
        const confirmPurchase = this.uiManager.showConfirmation(
            `Purchase ${marketingData.name} for ${costLabel}?`
        );

        if (confirmPurchase && this.businessLogic.purchaseMarketing(marketingType)) {
            this.uiManager.showNotification(`${marketingData.name} purchased!`, 'success');
        } else if (confirmPurchase) {
            this.uiManager.showNotification(`Not enough money. Need $${marketingData.cost.toLocaleString()}.`, 'error');
        }
    }

    // Order supplies with slider-selected quantity. Unit price applies bulk
    // tier, the day's market multiplier (hard mode), and supplier tier (basic/premium).
    orderSupplies(supplierType, quantity) {
        const supplier = GameData.supplierTypes[supplierType];
        if (!supplier) return;

        const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 10));
        const bulk = GameData.getSupplyTier(qty);
        const market = (this.gameState.marketPrices || GameData.defaultMarketPrices())[supplierType] ?? 1.0;
        const tiers = this.gameState.setup.supplierTiers || GameData.defaultSupplierTiers();
        const isPremium = tiers[supplierType] === 'premium';
        const tierMult = isPremium ? GameData.premium.multiplier : 1.0;

        const unitPrice = (supplier.basePrice / 10) * bulk.mult * market * tierMult;
        const totalCost = Math.round(unitPrice * qty * 100) / 100;

        if (this.gameState.money < totalCost) {
            this.uiManager.showNotification(
                `Not enough money. Need $${totalCost.toFixed(2)}.`, 'error'
            );
            return;
        }

        this.gameState.spendMoney(totalCost);
        this.gameState.addInventory(supplierType, qty);
        this.gameState.incrementSupplierOrders(supplierType);

        const label = isPremium ? `premium ${supplier.name.toLowerCase()}` : supplier.name.toLowerCase();
        this.uiManager.showNotification(
            `Ordered ${qty} ${label} for $${totalCost.toFixed(2)}.`, 'success'
        );
    }

    // Toggle a supplier's tier. Requires day 30+ and 10+ orders with that supplier.
    toggleSupplierTier(supplierType) {
        const orders = (this.gameState.supplierOrders || {})[supplierType] || 0;
        const unlocked = this.gameState.day >= GameData.premium.unlockDay
            && orders >= GameData.premium.unlockOrders;

        if (!unlocked) {
            const daysLeft = Math.max(0, GameData.premium.unlockDay - this.gameState.day);
            const ordersLeft = Math.max(0, GameData.premium.unlockOrders - orders);
            this.uiManager.showNotification(
                `Premium locked. ${daysLeft > 0 ? daysLeft + ' days, ' : ''}${ordersLeft} more orders.`,
                'info'
            );
            return;
        }

        const tiers = { ...(this.gameState.setup.supplierTiers || GameData.defaultSupplierTiers()) };
        tiers[supplierType] = tiers[supplierType] === 'premium' ? 'basic' : 'premium';
        this.gameState.updateSetup('supplierTiers', tiers);
        this.uiManager.updateSuppliersTab();
    }

    // Toggle an ingredient in the player's live recipe.
    // The 'setup' observer already cascades UI updates (recipe/suppliers/inventory).
    toggleRecipeIngredient(ingredient) {
        const current = (this.gameState.setup.recipe || []).slice();
        const idx = current.indexOf(ingredient);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(ingredient);
        this.gameState.updateSetup('recipe', current);
    }

    toggleMealMode() {
        this.gameState.updateSetup('mealMode', !this.gameState.setup.mealMode);
        // Pricing + finances re-render on setup change too.
        this.uiManager.updateFinancesPanel();
    }

    // Adjust menu price by ±10% steps, clamped to 50%-150% of base.
    nudgePrice(dir) {
        const current = this.gameState.setup.priceMultiplier || 1.0;
        const next = Math.round((current + dir * 0.1) * 10) / 10;
        const clamped = Math.max(0.5, Math.min(1.5, next));
        if (clamped === current) return;
        this.gameState.updateSetup('priceMultiplier', clamped);
        this.uiManager.updatePricingPanel();
        this.uiManager.updateFinancesPanel();
    }

    upgradeBusiness(progressionType) {
        const business = this.gameState.business;

        if (progressionType === 'restaurant') {
            const cost = GameData.progression.restaurantCost;

            if (business.type === 'restaurant') {
                this.uiManager.showNotification('You already have a restaurant!', 'info');
                return;
            }

            if (this.gameState.money < cost) {
                this.uiManager.showNotification(`Not enough money. Need $${cost.toLocaleString()}.`, 'error');
                return;
            }

            const confirmUpgrade = this.uiManager.showConfirmation(
                `Upgrade to Restaurant for $${cost.toLocaleString()}?\n\n` +
                'This will:\n' +
                '- Unlock new employee types (Chef, Server, Manager)\n' +
                '- Increase customer capacity\n' +
                '- Enable higher revenue potential\n' +
                '- Increase monthly rent'
            );

            if (confirmUpgrade) {
                this.gameState.spendMoney(cost);
                this.gameState.upgradeBusiness('restaurant');
                this.uiManager.showNotification('Congratulations! You now own a restaurant!', 'success');
                this.uiManager.updateBusinessProgression();
                this.uiManager.updateEmployeeTypeSelect();
            }
        } else if (progressionType === 'chain') {
            const cost = GameData.progression.chainCost;

            if (business.type !== 'restaurant') {
                this.uiManager.showNotification('You need a restaurant first before expanding to a chain!', 'error');
                return;
            }

            if (business.type === 'chain') {
                this.uiManager.showNotification('You already have a chain!', 'info');
                return;
            }

            if (this.gameState.money < cost) {
                this.uiManager.showNotification(`Not enough money. Need $${cost.toLocaleString()}.`, 'error');
                return;
            }

            const confirmUpgrade = this.uiManager.showConfirmation(
                `Expand to Chain for $${cost.toLocaleString()}?\n\n` +
                'This will open a second location!'
            );

            if (confirmUpgrade) {
                this.gameState.spendMoney(cost);
                this.gameState.upgradeBusiness('chain');
                this.uiManager.showNotification('Amazing! You now own a restaurant chain!', 'success');
                this.uiManager.updateBusinessProgression();
            }
        }
    }

    checkAchievements() {
        // Check first employee achievement
        if (this.gameState.employees.length >= 1 && !this.hasAchievement('firstEmployee')) {
            this.unlockAchievement('firstEmployee');
        }

        // Check first upgrade achievement
        const hasAnyUpgrade = Object.values(this.gameState.upgrades).some(upgrade => upgrade);
        if (hasAnyUpgrade && !this.hasAchievement('firstUpgrade')) {
            this.unlockAchievement('firstUpgrade');
        }

        // Check social media achievement
        if (this.gameState.marketing.followers >= 1000 && !this.hasAchievement('socialMediaStar')) {
            this.unlockAchievement('socialMediaStar');
        }

        // Check millionaire achievement (total earnings)
        if (this.gameState.totalEarnings >= 1000000 && !this.hasAchievement('millionaire')) {
            this.unlockAchievement('millionaire');
        }

        // Cash-on-hand milestones — give the long grind to $10M some shape.
        const milestones = ['milestone100k', 'milestone500k', 'milestone1m', 'milestone5m'];
        milestones.forEach(id => {
            const ach = GameData.achievements[id];
            if (ach && this.gameState.money >= ach.cashThreshold && !this.hasAchievement(id)) {
                this.unlockAchievement(id);
            }
        });

        // Reputation tier milestones — confirm the visible tier promotion.
        Object.entries(GameData.achievements).forEach(([id, ach]) => {
            if (ach.reputationThreshold === undefined) return;
            if (this.gameState.reputation >= ach.reputationThreshold && !this.hasAchievement(id)) {
                this.unlockAchievement(id);
            }
        });
    }

    hasAchievement(achievementId) {
        // Simple achievement tracking - could be moved to GameState
        const unlockedAchievements = JSON.parse(localStorage.getItem('foodEmpireAchievements') || '[]');
        return unlockedAchievements.includes(achievementId);
    }

    unlockAchievement(achievementId) {
        const achievement = GameData.achievements[achievementId];
        if (!achievement) return;

        // Add to unlocked achievements
        const unlockedAchievements = JSON.parse(localStorage.getItem('foodEmpireAchievements') || '[]');
        unlockedAchievements.push(achievementId);
        localStorage.setItem('foodEmpireAchievements', JSON.stringify(unlockedAchievements));

        // Give reward
        this.gameState.addMoney(achievement.reward);
        
        // Show notification
        this.uiManager.showNotification(
            `Achievement Unlocked: ${achievement.name}! Reward: $${achievement.reward}`,
            'success'
        );

        // Big-ticket milestones (cash/reputation thresholds, millionaire) get a
        // celebratory burst — minor achievements (first hire, first upgrade,
        // social media) stay a plain notification so it doesn't feel constant.
        if (achievement.cashThreshold !== undefined || achievement.reputationThreshold !== undefined || achievementId === 'millionaire') {
            this.uiManager.celebrate();
            this.soundManager.play('achievement');
        }

        // Reputation-tier crossing feeds the news ticker with a flavor line.
        if (achievement.reputationThreshold !== undefined) {
            const tier = GameData.getReputationTier(this.gameState.reputation);
            const pool = GameData.newsTemplates.tierUp[tier.name];
            if (pool) {
                this.gameState.addNewsEntry({
                    day: this.gameState.day,
                    icon: tier.icon,
                    message: GameData.getNewsLine(pool, this.gameState.setup.businessName)
                });
            }
        }
    }

    checkGameOver() {
        // Check for bankruptcy
        if (this.gameState.money <= 0 && this.gameState.day > 7) {
            this.gameOver('bankruptcy');
            return;
        }
        
        // Check for winning condition
        if (this.gameState.money >= GameData.progression.winCondition) {
            this.gameOver('victory');
            return;
        }
    }

    gameOver(reason) {
        let message = '';
        
        switch(reason) {
            case 'bankruptcy':
                message = `Game Over! Your business ran out of money on day ${this.gameState.day}. Better luck next time!`;
                break;
            case 'victory':
                message = `Congratulations! You've built a $1 million food empire in ${this.gameState.day} days!`;
                break;
        }
        
        const playAgain = this.uiManager.showConfirmation(
            `${message}\n\nWould you like to start a new game?`
        );
        
        if (playAgain) {
            this.newGame();
        }
    }

    newGame() {
        // Reset game state
        this.gameState.reset();
        
        // Clear saved game
        localStorage.removeItem('foodEmpireGameState');
        
        // Reload the page to restart setup
        window.location.reload();
    }

    restartGame() {
        const confirmRestart = this.uiManager.showConfirmation(
            'Are you sure you want to start over? This will reset all your progress and cannot be undone.\n\nYour current progress:\n' +
            `• Money: $${this.gameState.money.toLocaleString()}\n` +
            `• Day: ${this.gameState.day}\n` +
            `• Employees: ${this.gameState.employees.length}\n` +
            `• Reputation: ${this.gameState.reputation}\n\n` +
            'Click OK to start a new game, or Cancel to continue playing.'
        );
        
        if (confirmRestart) {
            // Reset in-memory state first so the beforeunload autoSave short-circuits
            // (autoSave skips when setup.businessName is empty). Otherwise the save
            // we just removed gets rewritten during reload.
            this.gameState.reset();

            // Clear saved game from localStorage
            localStorage.removeItem('foodEmpireGameState');

            // Clear achievements if desired (optional - comment out to keep achievements)
            // localStorage.removeItem('foodEmpireAchievements');

            // Show transition message
            this.uiManager.showNotification('Starting new game...', 'info');

            // Small delay for user feedback, then reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    showTutorial() {
        const showTutorialConfirm = this.uiManager.showConfirmation(
            'Would you like to restart the tutorial? This will guide you through the game basics again.'
        );
        
        if (showTutorialConfirm) {
            this.tutorialManager.restartTutorial('day1');
        }
    }

    saveGame() {
        if (this.gameState.save()) {
            this.uiManager.showNotification('Game saved successfully!', 'success');
        } else {
            this.uiManager.showNotification('Failed to save game.', 'error');
        }
    }

    loadGame() {
        const confirmLoad = this.uiManager.showConfirmation(
            'Load saved game? This will overwrite your current progress.'
        );
        
        if (confirmLoad && this.gameState.load()) {
            this.uiManager.showNotification('Game loaded successfully!', 'success');
            this.uiManager.updateAllDisplays();
        } else if (confirmLoad) {
            this.uiManager.showNotification('Failed to load game.', 'error');
        }
    }

    setupAutoSave() {
        // Auto-save every 5 minutes
        setInterval(() => {
            this.autoSave();
        }, 300000); // 5 minutes
    }

    autoSave() {
        // Only auto-save if game has started
        if (this.gameState.setup.businessName) {
            this.gameState.save();
        }
    }

    handleKeyboardShortcuts(event) {
        // Only handle shortcuts if not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const tabKeys = { '1': 'business', '2': 'recipe', '3': 'suppliers', '4': 'employees', '5': 'marketing', '6': 'upgrades' };
        const gameInterface = document.getElementById('gameInterface');
        if (tabKeys[event.key] && gameInterface && !gameInterface.classList.contains('hidden')) {
            event.preventDefault();
            this.uiManager.switchTab(tabKeys[event.key]);
            return;
        }

        switch(event.key.toLowerCase()) {
            case 'n':
                // Next day
                event.preventDefault();
                this.processNextDay();
                break;
            case 's':
                if (event.ctrlKey) {
                    // Ctrl+S to save
                    event.preventDefault();
                    this.saveGame();
                }
                break;
            case 'l':
                if (event.ctrlKey) {
                    // Ctrl+L to load
                    event.preventDefault();
                    this.loadGame();
                }
                break;
        }
    }

    // Trigger tutorial events
    triggerTutorialEvent(eventType, data = null) {
        const event = new CustomEvent('tutorialEvent', {
            detail: { type: eventType, data: data }
        });
        document.dispatchEvent(event);
    }

    // Initialize the game
    initialize() {
        console.log('Food Empire Tycoon - Game Controller initialized');
        
        // Initialize setup manager
        this.setupManager.initialize();
        
        // Add landing page hover effects
        this.initializeLandingPageEffects();
        
        // Make tutorial manager globally accessible
        window.tutorialManager = this.tutorialManager;
    }

    initializeLandingPageEffects() {
        // Feature card hover effects
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}

// Export for module usage
window.GameController = GameController;