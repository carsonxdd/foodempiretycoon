/**
 * SetupManager Module - Handles game setup wizard
 */
class SetupManager {
    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.currentStep = 1;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.elements = {
            startButton: document.getElementById('startGame'),
            setupScreen: document.getElementById('setupScreen'),
            gameInterface: document.getElementById('gameInterface'),
            mainContent: document.querySelector('main'),
            
            // Setup steps
            setupSteps: document.querySelectorAll('.setup-step'),
            
            // Step 1: Business name
            businessNameInput: document.getElementById('businessName'),
            
            // Step 2: Food options
            foodOptions: document.querySelectorAll('.food-option'),
            
            // Step 3: Location options
            locationOptions: document.getElementById('locationOptions'),
            
            // Step 4: Difficulty options
            difficultyOptions: document.querySelectorAll('.difficulty-option'),
            
            // Step 5: Review
            reviewName: document.getElementById('reviewName'),
            reviewFood: document.getElementById('reviewFood'),
            reviewLocation: document.getElementById('reviewLocation'),
            reviewDifficulty: document.getElementById('reviewDifficulty'),
            
            // Navigation buttons
            nextButtons: document.querySelectorAll('.next-step'),
            startOverButton: document.getElementById('startOver'),
            beginGameButton: document.getElementById('beginGame')
        };
    }

    setupEventListeners() {
        // Start game button — branches based on whether a saved game exists.
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', () => this.handleStartClick());
        }

        // Resume modal buttons.
        const resumeBtn = document.getElementById('resumeGame');
        const freshBtn = document.getElementById('startFresh');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeSavedGame());
        }
        if (freshBtn) {
            freshBtn.addEventListener('click', () => this.startFreshFromModal());
        }

        // Next step buttons
        this.elements.nextButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleNextStep(e));
        });

        // Food type selection
        this.elements.foodOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectFoodType(e));
        });

        // Location selection
        if (this.elements.locationOptions) {
            this.elements.locationOptions.addEventListener('click', (e) => this.selectLocation(e));
        }

        // Difficulty selection
        this.elements.difficultyOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectDifficulty(e));
        });

        // Start over button
        if (this.elements.startOverButton) {
            this.elements.startOverButton.addEventListener('click', () => this.startOver());
        }

        // Begin game button
        if (this.elements.beginGameButton) {
            this.elements.beginGameButton.addEventListener('click', () => this.beginGame());
        }
    }

    showSetupScreen() {
        if (this.elements.mainContent) {
            this.elements.mainContent.style.display = 'none';
        }
        if (this.elements.setupScreen) {
            this.elements.setupScreen.classList.remove('hidden');
        }
        this.showStep(1);
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        
        // Hide all steps
        this.elements.setupSteps.forEach(step => step.classList.remove('active'));
        
        // Show current step
        const currentStepElement = document.getElementById(`step${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Generate content for specific steps
        if (stepNumber === 3) {
            this.generateLocationCards();
        }
    }

    handleNextStep(event) {
        const currentStepElement = event.target.closest('.setup-step');
        const stepId = currentStepElement.id;
        const stepNumber = parseInt(stepId.replace('step', ''));

        // Validate current step before proceeding
        if (!this.validateStep(stepNumber)) {
            return;
        }

        // Process step data
        this.processStepData(stepNumber);

        // Move to next step
        this.showStep(stepNumber + 1);
    }

    validateStep(stepNumber) {
        switch(stepNumber) {
            case 1:
                if (!this.gameState.setup.foodType) {
                    this.showError('Please select a food type!');
                    return false;
                }
                return true;
            case 2:
                const businessName = this.elements.businessNameInput?.value.trim();
                if (!businessName) {
                    this.showError('Please enter a business name!');
                    return false;
                }
                return true;
            case 3:
                if (!this.gameState.setup.location) {
                    this.showError('Please select a location!');
                    return false;
                }
                return true;
            case 4:
                if (!this.gameState.setup.difficulty) {
                    this.showError('Please select a difficulty level!');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    processStepData(stepNumber) {
        switch(stepNumber) {
            case 2:
                const businessName = this.elements.businessNameInput?.value.trim();
                this.gameState.updateSetup('businessName', businessName);
                break;
            // Other steps are handled by their specific event handlers
        }
    }

    selectFoodType(event) {
        const foodType = event.currentTarget.dataset.food;
        this.gameState.updateSetup('foodType', foodType);

        // Update UI
        this.elements.foodOptions.forEach(opt => opt.classList.remove('active'));
        event.currentTarget.classList.add('active');

        // Auto-advance to the business name step
        setTimeout(() => {
            this.showStep(2);
            // Focus the name input so they can type immediately
            if (this.elements.businessNameInput) this.elements.businessNameInput.focus();
        }, 400);
    }

    generateLocationCards() {
        if (!this.elements.locationOptions) return;

        const locations = GameData.locations;
        this.elements.locationOptions.innerHTML = locations.map(location => `
            <div class="location-card" data-location="${location.name}">
                <h4>${location.name}</h4>
                <p>${location.description}</p>
                <div class="location-stats">
                    <div class="location-stat">Population: ${location.population.toLocaleString()}</div>
                    <div class="location-stat">Foot Traffic: ${location.stats.footTraffic}</div>
                    <div class="location-stat">Competition: ${location.stats.competition}</div>
                    <div class="location-stat">Rent: ${location.stats.rent}</div>
                    <div class="location-stat">Customer Type: ${location.stats.customerType}</div>
                </div>
            </div>
        `).join('');
    }

    selectLocation(event) {
        const locationCard = event.target.closest('.location-card');
        if (!locationCard) return;

        const locationName = locationCard.dataset.location;
        const location = GameData.getLocationByName(locationName);
        
        if (location) {
            this.gameState.updateSetup('location', location);
            
            // Update UI
            this.elements.locationOptions.querySelectorAll('.location-card').forEach(card => 
                card.classList.remove('active'));
            locationCard.classList.add('active');
            
            // Auto-advance to next step
            setTimeout(() => this.showStep(4), 500);
        }
    }

    selectDifficulty(event) {
        const difficulty = event.currentTarget.dataset.difficulty;
        this.gameState.updateSetup('difficulty', difficulty);
        
        // Update UI
        this.elements.difficultyOptions.forEach(opt => opt.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // Auto-advance to review step
        setTimeout(() => {
            this.showStep(5);
            this.updateReview();
        }, 500);
    }

    updateReview() {
        const setup = this.gameState.setup;
        
        if (this.elements.reviewName) {
            this.elements.reviewName.textContent = setup.businessName || 'Not set';
        }
        if (this.elements.reviewFood) {
            this.elements.reviewFood.textContent = setup.foodType ? 
                GameData.foodTypes[setup.foodType]?.name || setup.foodType : 'Not selected';
        }
        if (this.elements.reviewLocation) {
            this.elements.reviewLocation.textContent = setup.location?.name || 'Not selected';
        }
        if (this.elements.reviewDifficulty) {
            const difficultyData = GameData.getDifficultySettings(setup.difficulty);
            this.elements.reviewDifficulty.textContent = difficultyData.name;
        }
    }

    startOver() {
        // Reset game state setup
        this.gameState.updateSetup('businessName', '');
        this.gameState.updateSetup('foodType', '');
        this.gameState.updateSetup('location', null);
        this.gameState.updateSetup('difficulty', 'normal');
        
        // Reset UI
        if (this.elements.businessNameInput) {
            this.elements.businessNameInput.value = '';
        }
        
        this.elements.foodOptions.forEach(opt => opt.classList.remove('active'));
        this.elements.difficultyOptions.forEach(opt => opt.classList.remove('active'));
        
        if (this.elements.locationOptions) {
            this.elements.locationOptions.querySelectorAll('.location-card').forEach(card => 
                card.classList.remove('active'));
        }
        
        // Go back to step 1
        this.showStep(1);
    }

    beginGame() {
        const setup = this.gameState.setup;
        
        // Final validation
        if (!setup.businessName || !setup.foodType || !setup.location || !setup.difficulty) {
            this.showError('Please complete all setup steps!');
            return;
        }

        // Apply difficulty settings to starting money
        const difficultyData = GameData.getDifficultySettings(setup.difficulty);
        this.gameState.setMoney(difficultyData.startingMoney);

        // Initialize recipe from the chosen food's default.
        const foodData = GameData.getFoodTypeData(setup.foodType);
        if (foodData) {
            this.gameState.updateSetup('recipe', foodData.defaultRecipe.slice());
        }

        // Starter inventory — you wouldn't open without food on hand.
        this.gameState.addInventory('bread', 15);
        this.gameState.addInventory('vegetables', 15);
        this.gameState.addInventory('meat', 15);
        this.gameState.addInventory('cheese', 15);
        // Small stock of meal extras if the player turns on meal mode.
        this.gameState.addInventory('drinks', 5);
        this.gameState.addInventory('sides', 5);

        // Starting crew — you and one helper.
        this.gameState.addEmployee({
            type: 'cook',
            salary: GameData.getEmployeeType('cook').salary,
            hiredDay: 1
        });
        this.gameState.addEmployee({
            type: 'cashier',
            salary: GameData.getEmployeeType('cashier').salary,
            hiredDay: 1
        });

        // Smooth handoff: fade out setup, then fade in the game interface.
        const setupEl = this.elements.setupScreen;
        const gameEl = this.elements.gameInterface;

        if (setupEl) {
            setupEl.style.transition = 'opacity 260ms ease';
            setupEl.style.opacity = '0';
            setTimeout(() => {
                setupEl.classList.add('hidden');
                setupEl.style.opacity = '';
                setupEl.style.transition = '';
            }, 280);
        }

        if (gameEl) {
            gameEl.classList.remove('hidden');
            gameEl.style.opacity = '0';
            requestAnimationFrame(() => {
                gameEl.style.transition = 'opacity 340ms ease';
                gameEl.style.opacity = '1';
                setTimeout(() => {
                    gameEl.style.transition = '';
                    gameEl.style.opacity = '';
                }, 360);
            });
        }

        // Initialize game UI
        this.uiManager.initializeGameUI();
        
        // Show welcome message
        this.uiManager.showNotification(
            `Welcome to ${setup.businessName}! Your ${setup.foodType} business is now open in ${setup.location.name}!`,
            'success'
        );

        // Trigger tutorial start if it exists
        if (window.tutorialManager) {
            window.tutorialManager.checkAutoStart();
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with better UI
        alert(message);
    }

    // Start button click: if a save exists, surface the resume modal.
    // Otherwise go directly to the setup wizard. No auto-prompt on page load.
    handleStartClick() {
        const saved = localStorage.getItem('foodEmpireGameState');
        if (saved) {
            this.showResumeModal(saved);
        } else {
            this.showSetupScreen();
        }
    }

    showResumeModal(savedRaw) {
        const modal = document.getElementById('resumeModal');
        if (!modal) {
            // Fallback if markup missing — just go to setup.
            this.showSetupScreen();
            return;
        }
        // Populate a compact snapshot from the saved state.
        try {
            const saved = JSON.parse(savedRaw);
            const snap = document.getElementById('resumeSnapshot');
            if (snap) {
                const name = saved?.setup?.businessName || 'Your business';
                const day = saved?.day || 1;
                const money = Math.round(saved?.money || 0);
                const business = saved?.business?.type || 'foodTruck';
                const businessLabel = business === 'foodTruck' ? 'Food Truck'
                                    : business === 'restaurant' ? 'Restaurant'
                                    : 'Chain';
                snap.innerHTML = `
                    <div class="resume-snapshot">
                        <div class="resume-name">${name}</div>
                        <div class="resume-stats">
                            <span>Day ${day}</span>
                            <span>$${money.toLocaleString()}</span>
                            <span>${businessLabel}</span>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            // If the save is corrupt, fall through — modal still shows, Start Fresh works.
            console.error('Could not parse saved game:', e);
        }
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    hideResumeModal() {
        const modal = document.getElementById('resumeModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    resumeSavedGame() {
        this.hideResumeModal();
        if (this.gameState.load()) {
            if (this.elements.mainContent) {
                this.elements.mainContent.style.display = 'none';
            }
            if (this.elements.gameInterface) {
                this.elements.gameInterface.classList.remove('hidden');
            }
            this.uiManager.initializeGameUI();
        } else {
            // Load failed — just show setup.
            this.showSetupScreen();
        }
    }

    startFreshFromModal() {
        this.hideResumeModal();
        // Reset in-memory state so autoSave doesn't overwrite the new setup.
        this.gameState.reset();
        localStorage.removeItem('foodEmpireGameState');
        this.showSetupScreen();
    }

    // Initialize the setup manager — no longer auto-prompts at page load.
    initialize() {
        console.log('Setup Manager initialized - landing ready.');
    }
}

// Export for module usage
window.SetupManager = SetupManager;