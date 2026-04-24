/**
 * TutorialManager — lightweight action-driven coach.
 * Shows a small card bottom-right, one sentence per step, advances on
 * real user actions when possible. Runs once, persisted to localStorage.
 */
class TutorialManager {
    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.currentStep = 0;
        this.cardEl = null;

        // Each step: message, optional target to highlight, and how it advances.
        // advanceMode: 'next' (button click), 'event' (real action), 'finish' (done).
        this.steps = [
            {
                message: "Welcome to your food truck. Before you open, you need to stock up.",
                highlight: null,
                advanceMode: 'next',
            },
            {
                message: "This is your inventory. Each sale uses 1 of each ingredient. You can't serve what you don't have.",
                highlight: '.inventory-panel',
                advanceMode: 'next',
            },
            {
                message: "Open the <strong>Suppliers</strong> tab to buy more food.",
                highlight: "[data-tab='suppliers']",
                advanceMode: 'event',
                advanceOn: 'tabChanged:suppliers',
            },
            {
                message: "Order any ingredient to top up — 10 units at a time.",
                highlight: '.supplier-card',
                advanceMode: 'next',
            },
            {
                message: "Now head back to <strong>Business</strong> and click <strong>Next Day</strong> when you're ready.",
                highlight: "[data-tab='business']",
                advanceMode: 'event',
                advanceOn: 'dayAdvanced',
            },
            {
                message: "Opening weeks are quiet. Goal: <strong>$1,000,000</strong>. Good luck out there.",
                highlight: '.journal-panel',
                advanceMode: 'finish',
            },
        ];

        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('tutorialEvent', (e) => {
            this.handleEvent(e.detail.type);
        });
        this.gameState.addObserver((type) => {
            if (type === 'day') this.handleEvent('dayAdvanced');
        });
    }

    shouldRun() {
        return !localStorage.getItem('foodEmpireTutorialDone_v2');
    }

    markDone() {
        localStorage.setItem('foodEmpireTutorialDone_v2', '1');
    }

    checkAutoStart() {
        if (this.shouldRun() && this.gameState.day === 1) {
            setTimeout(() => this.start(), 700);
        }
    }

    start() {
        this.currentStep = 0;
        this.renderStep();
    }

    restart() {
        localStorage.removeItem('foodEmpireTutorialDone_v2');
        this.start();
    }

    // Legacy name — GameController.showTutorial calls this.
    restartTutorial() {
        this.restart();
    }

    renderStep() {
        this.clearHighlights();
        this.removeCard();

        const step = this.steps[this.currentStep];
        if (!step) {
            this.finish();
            return;
        }

        if (step.highlight) this.addHighlight(step.highlight);

        this.cardEl = this.buildCard(step);
        document.body.appendChild(this.cardEl);
        requestAnimationFrame(() => this.cardEl.classList.add('show'));
    }

    buildCard(step) {
        const el = document.createElement('div');
        el.className = 'tutorial-coach';

        const dots = this.steps.map((_, i) => {
            let cls = 'tutorial-dot';
            if (i < this.currentStep) cls += ' done';
            else if (i === this.currentStep) cls += ' active';
            return `<span class="${cls}"></span>`;
        }).join('');

        const showNext = step.advanceMode === 'next' || step.advanceMode === 'finish';
        const nextLabel = step.advanceMode === 'finish' ? 'Done' : 'Next';

        el.innerHTML = `
            <div class="tutorial-coach-header">
                <span class="tutorial-coach-step">Tutorial · ${this.currentStep + 1}/${this.steps.length}</span>
                <button class="tutorial-coach-close" aria-label="Skip tutorial">×</button>
            </div>
            <div class="tutorial-coach-body">
                <p>${step.message}</p>
            </div>
            <div class="tutorial-coach-footer">
                <div class="tutorial-dots">${dots}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="tutorial-skip arcade-button">Skip</button>
                    ${showNext ? `<button class="tutorial-next arcade-button primary">${nextLabel}</button>` : ''}
                </div>
            </div>
        `;

        el.querySelector('.tutorial-coach-close').addEventListener('click', () => this.skip());
        el.querySelector('.tutorial-skip').addEventListener('click', () => this.skip());
        const nextBtn = el.querySelector('.tutorial-next');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());

        return el;
    }

    addHighlight(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.add('tutorial-highlight');
            if (el.scrollIntoView) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight')
            .forEach(el => el.classList.remove('tutorial-highlight'));
    }

    removeCard() {
        if (!this.cardEl) return;
        const old = this.cardEl;
        old.classList.remove('show');
        setTimeout(() => {
            if (old.parentNode) old.parentNode.removeChild(old);
        }, 240);
        this.cardEl = null;
    }

    handleEvent(eventType) {
        if (!this.cardEl) return;
        const step = this.steps[this.currentStep];
        if (!step || step.advanceMode !== 'event') return;
        if (step.advanceOn === eventType) {
            this.nextStep();
        }
    }

    nextStep() {
        const step = this.steps[this.currentStep];
        if (step?.advanceMode === 'finish') {
            this.finish();
            return;
        }
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.finish();
            return;
        }
        this.renderStep();
    }

    skip() {
        this.clearHighlights();
        this.removeCard();
        this.markDone();
    }

    finish() {
        this.clearHighlights();
        this.removeCard();
        this.markDone();
        this.gameState.addMoney(500);
        this.uiManager.showNotification('Tutorial complete! +$500', 'success');
    }
}

window.TutorialManager = TutorialManager;
