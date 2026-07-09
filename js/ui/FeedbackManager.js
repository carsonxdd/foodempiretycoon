/**
 * FeedbackManager — opens the in-game feedback modal, gathers a small
 * anonymous game-state snapshot for context, and POSTs the report to the
 * Cloudflare Worker that forwards it to Discord. No backend on this side
 * (we're a static SPA); the Worker is the only piece that holds secrets.
 *
 * Setup: edit FEEDBACK_ENDPOINT below to your deployed Worker URL.
 * See worker/README.md for deploy instructions.
 */
class FeedbackManager {
    // Single point of configuration — replace this with the real Worker URL
    // after `wrangler deploy`. Empty string means "feedback disabled" and the
    // submit button will surface a friendly notice instead of silently failing.
    static FEEDBACK_ENDPOINT = 'https://food-empire-feedback.example.workers.dev';

    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.modal = document.getElementById('feedbackModal');
        this.messageField = document.getElementById('feedbackMessage');
        this.nameField = document.getElementById('feedbackName');
        this.charCount = document.getElementById('feedbackCharCount');
        this.submitButton = document.getElementById('feedbackSubmit');
        this.bindEvents();
    }

    bindEvents() {
        const open = document.getElementById('openFeedback');
        if (open) open.addEventListener('click', () => this.openModal());
        const openFooter = document.getElementById('openFeedbackFooter');
        if (openFooter) openFooter.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });
        if (this.modal) {
            this.modal.querySelectorAll('[data-feedback-close]').forEach(el =>
                el.addEventListener('click', () => this.closeModal()));
        }
        if (this.messageField && this.charCount) {
            this.messageField.addEventListener('input', () => {
                this.charCount.textContent = this.messageField.value.length;
            });
        }
        if (this.submitButton) {
            this.submitButton.addEventListener('click', () => this.submit());
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');
        // Focus the message box so users can just start typing.
        setTimeout(() => this.messageField?.focus(), 50);
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');
    }

    // Build the metadata payload that goes alongside the user's message.
    // Anonymous by default — only the optional name field is user-supplied.
    buildContext() {
        const s = this.gameState?.state || {};
        return {
            gameVersion: window.GAME_VERSION || 'unknown',
            day: s.day || null,
            money: typeof s.money === 'number' ? Math.round(s.money) : null,
            reputation: s.reputation || 0,
            businessType: s.business?.type || null,
            difficulty: s.setup?.difficulty || null,
            employees: Array.isArray(s.employees) ? s.employees.length : 0,
            url: location.pathname + location.search,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
        };
    }

    async submit() {
        const message = (this.messageField?.value || '').trim();
        if (!message) {
            this.uiManager?.showNotification('Please write something first.', 'error');
            this.messageField?.focus();
            return;
        }

        const endpoint = FeedbackManager.FEEDBACK_ENDPOINT;
        if (!endpoint || endpoint.includes('example.workers.dev')) {
            this.uiManager?.showNotification(
                'Feedback endpoint not configured yet. Try again later.', 'error');
            return;
        }

        const typeRadio = document.querySelector('input[name="feedbackType"]:checked');
        const payload = {
            type: typeRadio?.value || 'other',
            message,
            name: (this.nameField?.value || '').trim() || null,
            context: this.buildContext(),
        };

        // Optimistic UI: lock the button, show a sending state. We never want
        // a duplicate submission from a double-click.
        const original = this.submitButton.textContent;
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Sending…';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            this.uiManager?.showNotification('Thanks — feedback received!', 'success');
            this.resetForm();
            this.closeModal();
        } catch (err) {
            console.error('Feedback submit failed:', err);
            this.uiManager?.showNotification(
                'Could not send feedback — please try again later.', 'error');
        } finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = original;
        }
    }

    resetForm() {
        if (this.messageField) this.messageField.value = '';
        if (this.nameField) this.nameField.value = '';
        if (this.charCount) this.charCount.textContent = '0';
        const bugRadio = document.querySelector('input[name="feedbackType"][value="bug"]');
        if (bugRadio) bugRadio.checked = true;
    }
}

window.FeedbackManager = FeedbackManager;
