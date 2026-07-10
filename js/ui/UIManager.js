/**
 * UIManager Module - Central UI management and updates
 */
class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.elements = {};
        this.activeNotifications = [];
        this.lastReportHeading = '';
        this.modalCurrentDay = null;
        this.initializeElements();
        this.setupObserver();
        this.setupModalListeners();
    }

    // Initialize DOM element references
    initializeElements() {
        this.elements = {
            // Game stats
            money: document.getElementById('money'),
            reputation: document.getElementById('reputation'),
            day: document.getElementById('day'),
            
            // Business info
            businessNameDisplay: document.getElementById('businessNameDisplay'),
            businessLocation: document.getElementById('businessLocation'),
            businessType: document.getElementById('businessType'),
            dailyCustomers: document.getElementById('dailyCustomers'),
            
            // Daily summary
            dailySummary: document.getElementById('dailySummary'),

            // Inventory + recipe panel
            inventoryGrid: document.getElementById('inventoryGrid'),
            inventoryWarning: document.getElementById('inventoryWarning'),
            recipeRow: document.getElementById('recipeRow'),

            // Pricing + finances panels
            currentPrice: document.getElementById('currentPrice'),
            priceHint: document.getElementById('priceHint'),
            costPerSale: document.getElementById('costPerSale'),
            costHint: document.getElementById('costHint'),
            profitPerSale: document.getElementById('profitPerSale'),
            profitHint: document.getElementById('profitHint'),
            breakEvenPrice: document.getElementById('breakEvenPrice'),
            breakEvenHint: document.getElementById('breakEvenHint'),
            financesGrid: document.getElementById('financesGrid'),
            financesSummary: document.getElementById('financesSummary'),

            // Employees
            currentEmployees: document.getElementById('currentEmployees'),
            employeeTypeSelect: document.getElementById('employeeType'),
            
            // Tabs and buttons
            menuButtons: document.querySelectorAll('.menu-button'),
            tabs: document.querySelectorAll('.game-tab'),
            
            // Action buttons
            nextDayButton: document.getElementById('nextDay'),
            hireEmployeeButton: document.getElementById('hireEmployee'),
            buyMarketingButton: document.getElementById('buyMarketing')
        };
    }

    // Setup observer to watch for game state changes
    setupObserver() {
        this.gameState.addObserver((type, data) => {
            this.handleStateChange(type, data);
        });
    }

    // Wire the day modal's close + navigation buttons once.
    setupModalListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal-close]')) {
                this.closeDayModal();
            }
            if (e.target.id === 'dayModalPrev' || e.target.closest('#dayModalPrev')) {
                if (this.modalCurrentDay != null) {
                    this.soundManager?.play('pageFlip');
                    this.openDayModal(this.modalCurrentDay - 1);
                }
            }
            if (e.target.id === 'dayModalNext' || e.target.closest('#dayModalNext')) {
                if (this.modalCurrentDay != null) {
                    this.soundManager?.play('pageFlip');
                    this.openDayModal(this.modalCurrentDay + 1);
                }
            }
            const journalEntry = e.target.closest('.journal-entry');
            if (journalEntry && journalEntry.dataset.day) {
                this.openDayModal(parseInt(journalEntry.dataset.day, 10));
            }

            const hiChoice = e.target.closest('[data-hi-choice]');
            if (hiChoice && this._pendingHealthInspectorChoice) {
                const callback = this._pendingHealthInspectorChoice;
                this._pendingHealthInspectorChoice = null;
                this.hideHealthInspectorModal();
                callback(hiChoice.dataset.hiChoice);
            }
        });

        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('dayModal');
            if (!modal || modal.classList.contains('hidden')) return;
            if (e.key === 'Escape') this.closeDayModal();
            if (e.key === 'ArrowLeft' && this.modalCurrentDay != null) {
                this.soundManager?.play('pageFlip');
                this.openDayModal(this.modalCurrentDay - 1);
            }
            if (e.key === 'ArrowRight' && this.modalCurrentDay != null) {
                this.soundManager?.play('pageFlip');
                this.openDayModal(this.modalCurrentDay + 1);
            }
        });
    }

    // Handle game state changes
    handleStateChange(type, data) {
        switch(type) {
            case 'money':
                this.updateMoney(data);
                this.updateBusinessProgression();
                break;
            case 'reputation':
                this.updateReputation(data);
                this.updateStorefrontVisual();
                break;
            case 'day':
                this.updateDay(data);
                this.updateSuppliersTab();
                // Refresh employee list so training countdowns tick down.
                this.updateEmployeesList();
                this.updateStorefrontVisual();
                break;
            case 'employees':
                this.updateEmployeesList();
                this.updateFinancesPanel();
                this.updatePricingPanel();
                break;
            case 'marketing':
                this.updateMarketingButtons();
                this.updateFollowerDisplay();
                this.updateFinancesPanel();
                this.updatePricingPanel();
                break;
            case 'upgrades':
                this.updateUpgradeButtons();
                this.updatePricingPanel();
                this.updateStorefrontVisual();
                break;
            case 'business':
                this.updateBusinessInfo();
                this.updateBusinessProgression();
                this.updateFinancesPanel();
                this.updatePricingPanel();
                this.updateStorefrontVisual();
                break;
            case 'inventory':
                this.updateInventoryPanel();
                this.updateRecipePanel();
                break;
            case 'marketPrices':
            case 'supplierOrders':
                this.updateSuppliersTab();
                this.updatePricingPanel();
                break;
            case 'setup':
                // priceMultiplier, recipe, mealMode, etc. may have changed.
                this.updatePricingPanel();
                this.updateFinancesPanel();
                this.updateSuppliersTab();
                this.updateRecipePanel();
                this.updateInventoryPanel();
                break;
            case 'history':
                this.updateJournal();
                break;
            case 'newsFeed':
                this.updateNewsTicker();
                break;
            case 'rivalTruck':
                this.updateStorefrontVisual();
                break;
            case 'load':
                this.updateAllDisplays();
                break;
        }
    }

    // Compact list of past days on the Business tab.
    updateJournal() {
        const list = document.getElementById('journalList');
        if (!list) return;
        const hist = this.gameState.history || [];
        if (hist.length === 0) {
            list.innerHTML = '<p class="muted">No days logged yet. Hit Next Day to get started.</p>';
            return;
        }
        // Newest first so the last-played day sits on top.
        const entries = hist.slice().reverse();
        list.innerHTML = entries.map(e => {
            const profitClass = e.netProfit >= 0 ? 'profit' : 'loss';
            const sign = e.netProfit >= 0 ? '+' : '-';
            const amt = Math.round(Math.abs(e.netProfit)).toLocaleString();
            const preview = e.narrative || '';
            return `
                <div class="journal-entry" data-day="${e.day}">
                    <span class="j-day">DAY ${e.day} ${e.dayName.toUpperCase()}</span>
                    <span class="j-narrative">${preview}</span>
                    <span class="j-net ${profitClass}">${sign}$${amt}</span>
                </div>
            `;
        }).join('');
    }

    // Small "recently heard around town" feed — reputation-tier promotions
    // and viral marketing hits. Newest first, no animation (see
    // GameData.newsTemplates for the content, GameState.addNewsEntry for
    // the population points).
    updateNewsTicker() {
        const panel = document.getElementById('newsTicker');
        if (!panel) return;
        const feed = this.gameState.newsFeed || [];
        if (feed.length === 0) {
            panel.innerHTML = '<p class="muted">No buzz yet — keep the doors open.</p>';
            return;
        }
        const entries = feed.slice().reverse().slice(0, 5);
        panel.innerHTML = entries.map(e => `
            <div class="news-entry">
                <span class="n-icon">${e.icon || '📰'}</span>
                <span class="n-message">${e.message}</span>
                <span class="n-day">Day ${e.day}</span>
            </div>
        `).join('');
    }

    // Blocking choice modal for the health-inspector event (see
    // GameController.checkHealthInspectorTrigger). Renders cfg.choices
    // dynamically so GameData.healthInspectorEvent stays the single source
    // of truth for costs/odds. onChoice(choiceId) fires once, on click.
    showHealthInspectorModal(cfg, onChoice) {
        const modal = document.getElementById('healthInspectorModal');
        const body = document.getElementById('healthInspectorBody');
        if (!modal || !body) { onChoice('comply'); return; }

        this._pendingHealthInspectorChoice = onChoice;
        body.innerHTML = `
            <p>${cfg.intro}</p>
            <div class="hi-choices">
                ${cfg.choices.map(c => `
                    <button class="hi-choice" data-hi-choice="${c.id}">
                        <span class="hi-choice-label">${c.label}</span>
                        <span class="hi-choice-desc">${c.description}</span>
                    </button>
                `).join('')}
            </div>
        `;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    hideHealthInspectorModal() {
        const modal = document.getElementById('healthInspectorModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    // Open the day-recap modal for a given closing day.
    openDayModal(day) {
        const modal = document.getElementById('dayModal');
        if (!modal) return;
        const hist = this.gameState.history || [];
        const entry = hist.find(e => e.day === day);
        if (!entry) return;

        this.modalCurrentDay = day;
        document.getElementById('dayModalTitle').textContent = `Day ${entry.day} · ${entry.dayName}`;
        document.getElementById('dayModalBody').innerHTML = this.buildDayHTML(entry);

        const counter = document.getElementById('dayModalCounter');
        if (counter) counter.textContent = `Day ${entry.day} of ${hist.length}`;

        const prev = document.getElementById('dayModalPrev');
        const next = document.getElementById('dayModalNext');
        if (prev) prev.disabled = !hist.some(e => e.day === day - 1);
        if (next) next.disabled = !hist.some(e => e.day === day + 1);

        this.applyWeatherTint(modal, entry);

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    closeDayModal() {
        const modal = document.getElementById('dayModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        this.modalCurrentDay = null;
        this.applyWeatherTint(modal, null);
    }

    // Subtle full-card overlay matching the day's weather event, if any.
    // Most days have no event at all (7% daily trigger) — those show no tint.
    static WEATHER_TINT_CLASSES = {
        sunny_day: 'weather-sunny',
        rainy_day: 'weather-rain',
        cold_snap: 'weather-cold',
        heatwave: 'weather-heat',
    };
    applyWeatherTint(modal, entry) {
        const card = modal.querySelector('.day-modal-card');
        if (!card) return;
        Object.values(UIManager.WEATHER_TINT_CLASSES).forEach(cls => card.classList.remove(cls));

        const weatherEvent = entry?.events?.find(e => UIManager.WEATHER_TINT_CLASSES[e.type]);
        if (weatherEvent) {
            card.classList.add(UIManager.WEATHER_TINT_CLASSES[weatherEvent.type]);
        }
    }

    // Render the content of a single day's recap. Used inside the modal.
    buildDayHTML(entry) {
        const fmt = n => Math.round(n).toLocaleString();
        const { revenue, costs, netProfit, events, feedback, narrative, snapshot } = entry;
        const profitClass = netProfit >= 0 ? 'profit' : 'loss';
        const sign = netProfit >= 0 ? '+' : '-';

        let html = `
            <div class="narrative">${narrative || ''}</div>

            <div class="section">
                <h4>Snapshot at close</h4>
                <div class="snapshot-grid">
                    <div class="snapshot-tile">
                        <span class="label">Cash</span>
                        <span class="value">$${fmt(snapshot.money)}</span>
                    </div>
                    <div class="snapshot-tile">
                        <span class="label">Reputation</span>
                        <span class="value">${(() => {
                            const t = GameData.getReputationTier(snapshot.reputation);
                            return `${t.icon} ${t.name} <span class="muted">· ${snapshot.reputation}</span>`;
                        })()}</span>
                    </div>
                    <div class="snapshot-tile">
                        <span class="label">Regulars</span>
                        <span class="value">${snapshot.regulars}</span>
                    </div>
                    <div class="snapshot-tile">
                        <span class="label">Employees</span>
                        <span class="value">${snapshot.employeeCount}</span>
                    </div>
                    ${snapshot.followers > 0 ? `
                        <div class="snapshot-tile">
                            <span class="label">Followers</span>
                            <span class="value">${snapshot.followers.toLocaleString()}</span>
                        </div>` : ''}
                </div>
            </div>

            <details class="section">
                <summary style="cursor: pointer; font-size: var(--t-md);">
                    <strong>Numbers:</strong>
                    <span class="muted">${entry.customers} visitors · ${revenue.actualSales} sales · </span>
                    <span class="${profitClass}">${sign}$${fmt(Math.abs(netProfit))}</span>
                </summary>
                <div style="margin-top: var(--s-sm);">
                    <p>Revenue: <span class="money">$${fmt(revenue.totalRevenue)}</span></p>
                    <p>Wages: $${fmt(costs.employeeCosts)}</p>
                    <p>Rent: $${fmt(costs.rentCost)}</p>
                    ${costs.vehicleCost > 0 ? `<p>Vehicle payment: $${fmt(costs.vehicleCost)}</p>` : ''}
                    <p>License + permit: $${fmt(costs.licenseCost + costs.permitCost)}</p>
                    <p>Insurance: $${fmt(costs.insuranceCost)}</p>
                    <p>Disposables/gas: $${fmt(costs.ingredientCosts)}</p>
                    ${costs.marketingCosts > 0 ? `<p>Marketing: $${fmt(costs.marketingCosts)}</p>` : ''}
                    <hr>
                    <p>Conversion: ${(revenue.conversionRate * 100).toFixed(0)}% · Avg price: $${revenue.pricePerSale.toFixed(2)}</p>
                    ${revenue.lostSales > 0 ? `<p class="loss">Lost ${revenue.lostSales} sales to empty inventory</p>` : ''}
                </div>
            </details>
        `;

        if (events && events.length > 0) {
            html += `
                <div class="section">
                    <h4>What happened</h4>
                    ${events.map(e => `<p class="event">${e.icon || ''} ${e.message}</p>`).join('')}
                </div>
            `;
        }

        if (feedback && feedback.length > 0) {
            // Hard mode hides hints — figure it out yourself.
            const showHints = this.gameState.setup.difficulty !== 'hard';
            html += `
                <div class="section">
                    <h4>Today's comments</h4>
                    ${feedback.map((b, i) => {
                        // Defense in depth: getContextualFeedback weights
                        // complaints down by fix-progress, but if a partially
                        // fixed line still slips through we suppress the 💡
                        // once progress crosses 0.7 (close enough that the
                        // suggestion would feel like nagging).
                        const hintInfo = showHints && !b.positive
                            ? GameData.getFixHintInfo(b.message, this.gameState) : null;
                        const hint = hintInfo && !hintInfo.redundant ? hintInfo.text : null;
                        const regularInfo = b.isRegular
                            ? this.gameState.regularCustomers.find(r => r.name === b.name) : null;
                        return `
                        <div class="feedback-bubble ${b.positive ? 'positive' : 'negative'}"
                             style="animation-delay: ${i * 120}ms;">
                            <span class="who">${b.name}${regularInfo ? `<span class="regular-badge" title="${regularInfo.quirk} · visited ${regularInfo.visits}x">⭐ regular</span>` : ''}</span>
                            "${b.message}"
                            ${hint ? `<div class="fix-hint">💡 <span>${hint}</span></div>` : ''}
                        </div>
                    `;
                    }).join('')}
                </div>
            `;
        }

        return html;
    }

    // Recipe builder — renders cores, addons, meal toggle, and a live price preview.
    // Runs `updateFn` (an innerHTML swap that may grow/shrink an element's
    // content) as a smooth height transition instead of an instant snap.
    // Fixes the "whole page jumps down" feel when toggling a recipe chip —
    // the container animates from its old height to its new one rather than
    // reflowing everything below it in a single frame. No-ops (just runs
    // updateFn) under prefers-reduced-motion or if heights don't change.
    animateHeightChange(el, updateFn) {
        if (!el) { updateFn(); return; }
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // A prior toggle's animation may still be settling — cancel its
        // cleanup so it doesn't fire mid-way through this one and clear
        // styles out from under it.
        if (el._heightAnimCleanup) el._heightAnimCleanup();

        if (reducedMotion) { updateFn(); return; }

        const startHeight = el.offsetHeight;
        updateFn();
        const endHeight = el.scrollHeight;
        if (startHeight === endHeight) return;

        el.style.height = startHeight + 'px';
        el.style.overflow = 'hidden';
        void el.offsetHeight; // force reflow so the transition picks up the start height
        el.style.transition = 'height var(--t-normal) ease';

        requestAnimationFrame(() => {
            el.style.height = endHeight + 'px';
        });

        const cleanup = () => {
            el.style.height = '';
            el.style.overflow = '';
            el.style.transition = '';
            el.removeEventListener('transitionend', onEnd);
            clearTimeout(fallbackId);
            el._heightAnimCleanup = null;
        };
        const onEnd = (e) => {
            if (e.target !== el || e.propertyName !== 'height') return;
            cleanup();
        };
        // Safety net: if transitionend never fires (tab backgrounded during
        // the transition, `transition` overridden elsewhere, etc.), don't
        // leave the element permanently clipped at the old height.
        const fallbackId = setTimeout(cleanup, 400);
        el.addEventListener('transitionend', onEnd);
        el._heightAnimCleanup = cleanup;
    }

    updateRecipePanel() {
        const food = GameData.getFoodTypeData(this.gameState.setup.foodType);
        if (!food) return;

        const setup = this.gameState.setup;
        const currentRecipe = setup.recipe || [];
        // Per-food cores only — e.g. burger shows 3 cores, no meat slot on pizza.
        const coreKeys = GameData.getCoreRecipe(setup.foodType);
        // Only offer toppings tagged for this food (e.g. pepperoni/parmesan
        // only show for pizza) — but keep showing anything already active in
        // the recipe so an old save with a since-restricted addon can still
        // toggle it off instead of getting stuck.
        const addonKeys = Object.keys(GameData.recipeAddons).filter(key => {
            const a = GameData.recipeAddons[key];
            return !a.foods || a.foods.includes(setup.foodType) || currentRecipe.includes(key);
        });

        // Per-category consumption for the *current* recipe, used for cumulative totals.
        const liveConsumption = GameData.computeRecipeConsumption(setup);

        const renderCoreChip = (key) => {
            const parent = GameData.supplierTypes[key];
            const display = GameData.getCoreDisplay(setup.foodType, key);
            const on = currentRecipe.includes(key);
            const total = liveConsumption[key] || 0;
            const totalNote = on && total > 1
                ? `<span class="chip-total">→ ${total} ${parent.name.toLowerCase()}/sale total</span>`
                : '';
            return `
                <div class="recipe-chip ${on ? 'on' : 'off'}" data-ingredient="${key}">
                    <div class="chip-head">
                        <span class="chip-icon">${display.icon}</span>
                        <span>${display.name}</span>
                    </div>
                    <span class="chip-meta">from ${parent.name} stock · 1/sale</span>
                    ${totalNote}
                </div>
            `;
        };

        const renderAddonChip = (key) => {
            const a = GameData.recipeAddons[key];
            const parent = GameData.supplierTypes[a.parent];
            const on = currentRecipe.includes(key);
            const parentTotal = liveConsumption[a.parent] || 0;
            const totalNote = on
                ? `<span class="chip-total">→ ${parentTotal} ${parent.name.toLowerCase()}/sale total</span>`
                : `<span class="chip-total muted">if on: ${parentTotal + a.consumption} ${parent.name.toLowerCase()}/sale</span>`;
            return `
                <div class="recipe-chip ${on ? 'on' : 'off'}" data-ingredient="${key}">
                    <div class="chip-head">
                        <span class="chip-icon">${a.icon}</span>
                        <span>${a.name}</span>
                    </div>
                    <span class="chip-meta">+${a.consumption} ${parent.name.toLowerCase()}/sale</span>
                    ${totalNote}
                    <div class="chip-bonus">
                        <span class="price-bonus">+$${a.priceBonus.toFixed(2)} price</span>
                        <span class="appeal-bonus">+${Math.round(a.appealBonus * 100)}% appeal</span>
                    </div>
                </div>
            `;
        };

        const coreEl = document.getElementById('recipeCoreChips');
        const addonEl = document.getElementById('recipeAddonChips');
        if (coreEl) this.animateHeightChange(coreEl, () => { coreEl.innerHTML = coreKeys.map(renderCoreChip).join(''); });
        if (addonEl) this.animateHeightChange(addonEl, () => { addonEl.innerHTML = addonKeys.map(renderAddonChip).join(''); });

        // Meal toggle
        const mealRow = document.getElementById('mealToggleRow');
        if (mealRow) {
            const on = !!setup.mealMode;
            mealRow.innerHTML = `
                <div class="meal-toggle ${on ? 'on' : ''}" data-toggle="meal">
                    <span class="switch-dot"></span>
                    <span>🥤🍟 Bundle as meal (+$${GameData.mealBonus})</span>
                </div>
            `;
        }

        // Live summary: final sell price + conversion snapshot + per-sale cost
        const summary = document.getElementById('recipeSummary');
        if (summary) {
            let price = food.basePrice;
            const addonPriceParts = [];
            currentRecipe.forEach(ing => {
                const a = GameData.recipeAddons[ing];
                if (a) {
                    price += a.priceBonus;
                    addonPriceParts.push(`${a.icon} +$${a.priceBonus.toFixed(2)}`);
                }
            });
            if (setup.mealMode) {
                price += GameData.mealBonus;
                addonPriceParts.push(`🥤🍟 +$${GameData.mealBonus.toFixed(2)}`);
            }
            const mult = setup.priceMultiplier || 1.0;
            price *= mult;

            // Conversion preview — uses per-food cores so burgers don't get docked for skipping veg.
            let conv = 0.7;
            const coresForFood = GameData.getCoreRecipe(setup.foodType);
            const missing = coresForFood.filter(k => !currentRecipe.includes(k)).length;
            conv -= missing * 0.15;
            conv -= (mult - 1) * 0.6;
            currentRecipe.forEach(ing => {
                const a = GameData.recipeAddons[ing];
                if (a?.appealBonus) conv += a.appealBonus;
            });
            conv = Math.max(0.10, Math.min(0.95, conv));

            // Per-sale ingredient consumption with labels.
            const consumption = GameData.computeRecipeConsumption(setup);
            const consLines = Object.entries(consumption).map(([k, v]) => {
                const s = GameData.supplierTypes[k];
                return `<div class="cons-line"><span>${s?.icon || ''} ${s?.name || k}</span><span class="cons-qty">${v}/sale</span></div>`;
            }).join('');

            // Inventory coverage: how many sales the current stock supports.
            const inv = this.gameState.inventory;
            const cats = Object.keys(consumption);
            const coverage = cats.length > 0
                ? Math.min(...cats.map(k => Math.floor((inv[k] || 0) / consumption[k])))
                : 0;

            this.animateHeightChange(summary, () => {
                summary.innerHTML = `
                    <div>
                        <div class="summary-label">Sell price</div>
                        <div class="summary-price">$${price.toFixed(2)}</div>
                        <div class="summary-breakdown">${food.name} base $${food.basePrice}${addonPriceParts.length ? ' · ' + addonPriceParts.join(' · ') : ''}${mult !== 1 ? ` · ${(mult * 100).toFixed(0)}% price` : ''}</div>
                    </div>
                    <div>
                        <div class="summary-label">Per sale consumes</div>
                        <div class="summary-cons">${consLines || '<span class="muted">Nothing in the recipe.</span>'}</div>
                        <div class="summary-breakdown">Current stock supports ~${coverage} ${coverage === 1 ? 'sale' : 'sales'}</div>
                    </div>
                    <div>
                        <div class="summary-label">Conversion</div>
                        <div class="summary-conversion">${Math.round(conv * 100)}%${missing > 0 ? ` <span class="loss">(${missing} cores off)</span>` : ''}</div>
                    </div>
                `;
            });
        }
    }

    // "What's in the truck" — always shows all four bulk category stockpiles
    // (so the player sees unused veg waiting for a topping decision). Meal
    // extras appear only when meal mode is on.
    updateInventoryPanel() {
        if (!this.elements.inventoryGrid) return;

        const setup = this.gameState.setup;
        const bulkCategories = ['bread', 'vegetables', 'meat', 'cheese'];
        const needed = setup.mealMode
            ? bulkCategories.concat(['drinks', 'sides'])
            : bulkCategories;
        const inv = this.gameState.inventory;
        const cores = GameData.getCoreRecipe(setup.foodType);
        const consumption = GameData.computeRecipeConsumption(setup);

        this.elements.inventoryGrid.innerHTML = needed.map(key => {
            const supplier = GameData.supplierTypes[key];
            if (!supplier) return '';
            const count = inv[key] || 0;
            const inUse = (consumption[key] || 0) > 0;
            let cls = '';
            if (inUse && count === 0) cls = 'empty';
            else if (inUse && count < 5) cls = 'low';
            else if (!inUse) cls = 'idle';
            // For cores of this food, show the menu name (Bun) with the bulk category subtext.
            const isFoodCore = cores.includes(key);
            const display = isFoodCore
                ? GameData.getCoreDisplay(setup.foodType, key)
                : { name: supplier.name, icon: supplier.icon };
            const sub = isFoodCore && display.name !== supplier.name
                ? `<span class="sublabel">from ${supplier.name}</span>`
                : (!isFoodCore && supplier.isCore ? `<span class="sublabel">not in recipe</span>` : '');
            return `
                <div class="inventory-slot ${cls}">
                    <span class="icon">${display.icon}</span>
                    <span class="count">${count}</span>
                    <span class="label">${display.name}</span>
                    ${sub}
                </div>
            `;
        }).join('');

        if (this.elements.inventoryWarning) {
            // Only warn on categories the recipe actually uses.
            const usedKeys = Object.keys(consumption);
            const sales = usedKeys.length > 0
                ? Math.min(...usedKeys.map(k => Math.floor((inv[k] || 0) / consumption[k])))
                : 0;
            if (sales === 0 && usedKeys.length > 0) {
                const zero = usedKeys.find(k => (inv[k] || 0) < (consumption[k] || 0));
                const who = zero ? GameData.supplierTypes[zero] : null;
                this.elements.inventoryWarning.innerHTML =
                    `<div class="inventory-warning">Out of ${who ? who.name.toLowerCase() : 'supplies'} — no sales today until you restock.</div>`;
            } else if (sales < 5 && usedKeys.length > 0) {
                this.elements.inventoryWarning.innerHTML =
                    `<div class="inventory-warning">Running low. ${sales} sales worth left.</div>`;
            } else {
                this.elements.inventoryWarning.innerHTML = '';
            }
        }
    }

    // Update money display
    updateMoney(amount) {
        if (this.elements.money) {
            this.elements.money.textContent =
                `$${Math.round(amount).toLocaleString()}`;
            
            // Add visual feedback for money changes
            this.elements.money.classList.add('money-change');
            setTimeout(() => {
                this.elements.money.classList.remove('money-change');
            }, 500);
        }
    }

    // Update reputation display — tier badge + numeric value with a thin
    // progress bar to the next tier so growth feels tangible. Tiers:
    // Unknown → Local Spot → Buzzing → Hot Spot → Iconic.
    updateReputation(amount) {
        if (!this.elements.reputation) return;
        const tier = GameData.getReputationTier(amount);
        const pct = Math.round(tier.progressToNext * 100);
        const nextLabel = tier.next ? `${pct}% to ${tier.next.name}` : 'Maxed';
        this.elements.reputation.innerHTML = `
            <span class="rep-tier" title="${nextLabel}">${tier.icon} ${tier.name}</span>
            <span class="rep-num">${amount}</span>
            <span class="rep-bar"><span class="rep-bar-fill" style="width:${pct}%"></span></span>
        `;
    }

    // Update day display with day-of-week so players feel the calendar.
    updateDay(day) {
        if (this.elements.day) {
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = weekDays[day % 7];
            this.elements.day.textContent = `${day} (${dayName})`;
        }
    }

    // Update business information display
    updateBusinessInfo() {
        const setup = this.gameState.setup;
        
        if (this.elements.businessNameDisplay && setup.businessName) {
            this.elements.businessNameDisplay.textContent = setup.businessName;
        }
        
        if (this.elements.businessLocation && setup.location) {
            this.elements.businessLocation.textContent = setup.location.name;
        }
        
        if (this.elements.businessType) {
            const businessType = this.gameState.business.type;
            const displayName = businessType === 'foodTruck' ? 'Food Truck' : 
                               businessType === 'restaurant' ? 'Restaurant' : 
                               businessType.charAt(0).toUpperCase() + businessType.slice(1);
            this.elements.businessType.textContent = displayName;
        }
    }

    // Live storefront visual — business-type icon plus badges that react to
    // upgrades owned, reputation tier, and the most recent day's weather event.
    updateStorefrontVisual() {
        const panel = document.getElementById('storefrontPanel');
        if (!panel) return;

        const businessType = this.gameState.business.type;
        const typeIcon = businessType === 'foodTruck' ? '🚚' : businessType === 'restaurant' ? '🏢' : '🏙️';
        const typeLabel = businessType === 'foodTruck' ? 'Food Truck' :
                           businessType === 'restaurant' ? 'Restaurant' : 'Chain';

        const badges = [];
        if (this.gameState.upgrades.seating) badges.push({ icon: '🪑', label: 'Seating' });
        if (this.gameState.upgrades.soundSystem) badges.push({ icon: '🎵', label: 'Sound System' });

        const tier = GameData.getReputationTier(this.gameState.reputation);
        const tierIndex = Math.max(0, GameData.reputationTiers.findIndex(t => t.name === tier.name));
        const crowd = '🧍'.repeat(tierIndex + 1);

        const hist = this.gameState.history || [];
        const lastDay = hist[hist.length - 1];
        const weatherEvent = lastDay?.events?.find(e => UIManager.WEATHER_TINT_CLASSES[e.type]);

        const rival = this.gameState.rivalTruck;
        const rivalStanding = rival.momentum >= 65 ? 'losing ground to'
            : rival.momentum <= 35 ? 'ahead of'
            : 'neck-and-neck with';

        panel.innerHTML = `
            <div class="storefront-visual">
                <div class="storefront-icon">
                    <span>${typeIcon}</span>
                    ${weatherEvent ? `<span class="storefront-weather" title="${weatherEvent.message}">${weatherEvent.icon}</span>` : ''}
                </div>
                <div class="storefront-meta">
                    <div class="storefront-type">${typeLabel}</div>
                    <div class="storefront-tier" title="${tier.name} · ${this.gameState.reputation} reputation">${tier.icon} ${tier.name}</div>
                    <div class="storefront-crowd" title="Crowd reflects reputation tier">${crowd}</div>
                    ${badges.length > 0 ? `<div class="storefront-badges">${badges.map(b => `<span title="${b.label}">${b.icon}</span>`).join('')}</div>` : ''}
                    <div class="storefront-rival" title="Rival momentum ${Math.round(rival.momentum)}/100">
                        <span class="rival-label">🥊 ${rivalStanding} ${rival.name}</span>
                        <span class="rival-bar"><span class="rival-bar-fill" style="width:${Math.round(rival.momentum)}%"></span></span>
                    </div>
                </div>
            </div>
        `;
    }

    // Update employees list display. Each row shows the employee's level
    // badge, current (level-scaled) salary, training status, and actions.
    updateEmployeesList() {
        if (!this.elements.currentEmployees) return;

        const employees = this.gameState.employees;

        if (employees.length === 0) {
            this.elements.currentEmployees.innerHTML = '<p>No employees hired yet</p>';
            return;
        }

        this.elements.currentEmployees.innerHTML = employees.map((emp, index) => {
            const empData = GameData.getEmployeeType(emp.type);
            const level = emp.level || 1;
            const salary = Math.round(GameData.getEmployeeSalary(emp));
            const next = GameData.canTrainEmployee(emp);

            let trainSection = '';
            if (emp.training) {
                const required = GameData.employeeLeveling.trainingDays[emp.training.targetLevel];
                const daysIn = this.gameState.day - emp.training.startDay;
                const daysLeft = Math.max(0, required - daysIn);
                trainSection = `<span class="training-status">Training L${emp.training.targetLevel} — ${daysLeft}d left</span>`;
            } else if (next) {
                trainSection = `<button class="train-button arcade-button" data-index="${index}">Train L${next.targetLevel} · $${next.cost.toLocaleString()} · ${next.days}d</button>`;
            }

            return `
                <div class="employee-item">
                    <div class="employee-info">
                        <span class="employee-name">${empData.name}</span>
                        <span class="employee-level">L${level}</span>
                        <span class="employee-salary">$${salary.toLocaleString()}/mo</span>
                    </div>
                    <div class="employee-actions">
                        ${trainSection}
                        <button class="fire-button arcade-button" data-index="${index}">Fire</button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.currentEmployees.querySelectorAll('.fire-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.fireEmployee(index);
            });
        });

        this.elements.currentEmployees.querySelectorAll('.train-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                if (this.businessLogic) {
                    const result = this.businessLogic.purchaseEmployeeTraining(index);
                    this.showNotification(result.message, result.success ? 'success' : 'error');
                }
            });
        });
    }

    // Fire an employee
    fireEmployee(index) {
        if (confirm('Are you sure you want to fire this employee?')) {
            this.gameState.removeEmployee(index);
        }
    }

    // Update marketing buttons
    updateMarketingButtons() {
        const marketing = this.gameState.marketing;

        // Update all marketing buttons
        const marketingButtons = document.querySelectorAll('.marketing-button');
        marketingButtons.forEach(button => {
            const marketingType = button.dataset.marketing;

            let isOwned = false;
            let requiresCamera = false;

            switch(marketingType) {
                case 'cameraSetup':
                    isOwned = marketing.hasCameraSetup;
                    break;
                case 'socialMediaAds':
                    isOwned = marketing.hasSocialMediaAds;
                    requiresCamera = !marketing.hasCameraSetup;
                    break;
                case 'influencerCollab':
                    isOwned = marketing.hasInfluencerCollab;
                    requiresCamera = !marketing.hasCameraSetup;
                    break;
            }

            if (isOwned) {
                button.textContent = 'Active';
                button.disabled = true;
                button.classList.add('purchased');
            } else if (requiresCamera) {
                button.textContent = 'Locked';
                button.disabled = true;
                button.title = 'Requires Camera Setup first';
            } else {
                button.textContent = 'Purchase';
                button.disabled = false;
                button.classList.remove('purchased');
            }
        });
    }

    // Update follower display
    updateFollowerDisplay() {
        const followerCount = document.getElementById('followerCount');
        if (followerCount) {
            followerCount.textContent = this.gameState.marketing.followers.toLocaleString();
        }
    }

    // Update business progression display
    updateBusinessProgression() {
        const businessStage = document.getElementById('businessStage');
        const progressToNext = document.getElementById('progressToNext');
        const restaurantButton = document.querySelector('[data-progression="restaurant"]');
        const chainButton = document.querySelector('[data-progression="chain"]');
        const chainItem = document.getElementById('chainUpgrade');

        const business = this.gameState.business;
        const money = this.gameState.money;

        // Update stage display
        if (businessStage) {
            const stageNames = {
                foodTruck: 'Food Truck',
                restaurant: 'Restaurant',
                chain: 'Restaurant Chain'
            };
            businessStage.textContent = stageNames[business.type] || 'Food Truck';
        }

        const restaurantCost = GameData.progression.restaurantCost;
        const chainCost = GameData.progression.chainCost;

        // Update progress display
        if (progressToNext) {
            if (business.type === 'foodTruck') {
                progressToNext.textContent = `$${money.toLocaleString()} / $${restaurantCost.toLocaleString()}`;
            } else if (business.type === 'restaurant') {
                progressToNext.textContent = `$${money.toLocaleString()} / $${chainCost.toLocaleString()}`;
            } else {
                progressToNext.textContent = 'Max Level Reached!';
            }
        }

        // Update restaurant upgrade button
        if (restaurantButton) {
            if (business.type !== 'foodTruck') {
                restaurantButton.textContent = 'Completed';
                restaurantButton.disabled = true;
                restaurantButton.classList.add('purchased');
            } else {
                restaurantButton.disabled = money < restaurantCost;
                restaurantButton.textContent = money >= restaurantCost
                    ? 'Upgrade'
                    : `Need ${GameData.formatCompactMoney(restaurantCost)}`;
            }
        }

        // Update chain upgrade button
        if (chainButton && chainItem) {
            if (business.type === 'chain') {
                chainButton.textContent = 'Completed';
                chainButton.disabled = true;
                chainItem.classList.remove('locked');
            } else if (business.type === 'restaurant') {
                chainItem.classList.remove('locked');
                chainButton.disabled = money < chainCost;
                chainButton.textContent = money >= chainCost
                    ? 'Expand'
                    : `Need ${GameData.formatCompactMoney(chainCost)}`;
            } else {
                chainItem.classList.add('locked');
                chainButton.textContent = 'Locked';
                chainButton.disabled = true;
            }
        }
    }

    // Render the Suppliers tab with a slider row per ingredient.
    // Unit prices reflect bulk tiers × market prices (hard mode drifts daily).
    updateSuppliersTab() {
        const list = document.getElementById('suppliersList');
        const banner = document.getElementById('marketBanner');
        if (!list) return;

        const isHard = this.gameState.setup.difficulty === 'hard';
        const market = this.gameState.marketPrices || GameData.defaultMarketPrices();

        if (banner) {
            if (isHard) {
                banner.className = 'market-banner hard';
                banner.textContent = 'Market prices drift daily on hard. Watch the arrows.';
            } else {
                banner.className = 'market-banner';
                banner.textContent = 'Stable pricing. Bulk orders (25+/50+) unlock small discounts.';
            }
        }

        // Show every supplier. Each row indicates whether the ingredient is
        // currently in the recipe (and therefore actually consumed per sale).
        // Non-recipe rows get a quick "Add to recipe" action.
        const entries = Object.entries(GameData.supplierTypes);
        list.innerHTML = entries.map(([key, s]) => {
            const state = this.readSupplierControls(key);
            return this.buildSupplierRowHTML(key, s, state, market[key] ?? 1.0);
        }).join('');

        list.querySelectorAll('.supplier-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const row = e.target.closest('.supplier-row');
                const key = row?.dataset?.supplier;
                if (!key) return;
                this.refreshSupplierRow(key, parseInt(e.target.value, 10));
            });
        });
    }

    readSupplierControls(key) {
        const existing = document.querySelector(`.supplier-row[data-supplier="${key}"] .supplier-slider`);
        const qty = existing ? parseInt(existing.value, 10) : 10;
        return { qty };
    }

    buildSupplierRowHTML(key, supplier, state, marketMult) {
        const qty = state.qty;
        const bulk = GameData.getSupplyTier(qty);
        const tiers = this.gameState.setup.supplierTiers || GameData.defaultSupplierTiers();
        const isPremium = tiers[key] === 'premium';
        const premiumMult = isPremium ? GameData.premium.multiplier : 1.0;

        // Is this ingredient currently consumed by the player's recipe?
        const setup = this.gameState.setup;
        const activeRecipe = setup.recipe || [];
        const inRecipe = activeRecipe.includes(key)
            || (setup.mealMode && (key === 'drinks' || key === 'sides'));
        const canAddToRecipe = supplier.isAddon && !activeRecipe.includes(key);

        const unitPrice = (supplier.basePrice / 10) * bulk.mult * marketMult * premiumMult;
        const total = unitPrice * qty;

        const marketArrow = marketMult > 1.05 ? '<span class="market-up">▲</span>'
                          : marketMult < 0.95 ? '<span class="market-down">▼</span>' : '';
        const bulkClass = bulk.mult < 1 ? 'bulk' : bulk.mult > 1 ? 'surcharge' : '';

        // Premium unlock state
        const orders = (this.gameState.supplierOrders || {})[key] || 0;
        const day = this.gameState.day;
        const unlockDay = GameData.premium.unlockDay;
        const unlockOrders = GameData.premium.unlockOrders;
        const unlocked = day >= unlockDay && orders >= unlockOrders;

        let tierSwitchHTML;
        if (unlocked) {
            tierSwitchHTML = `
                <div class="supplier-tier-switch ${isPremium ? 'premium' : 'basic'}" data-supplier="${key}">
                    <span class="tier-option ${!isPremium ? 'on' : ''}">Basic</span>
                    <span class="tier-option ${isPremium ? 'on' : ''}">★ Premium</span>
                </div>
            `;
        } else {
            const daysLeft = Math.max(0, unlockDay - day);
            const ordersLeft = Math.max(0, unlockOrders - orders);
            const parts = [];
            if (daysLeft > 0) parts.push(`${daysLeft} days`);
            if (ordersLeft > 0) parts.push(`${ordersLeft} orders`);
            tierSwitchHTML = `
                <div class="supplier-tier-switch locked" title="Premium unlocks with time and trust">
                    <span class="lock-icon">🔒</span>
                    <span>Premium — befriend supplier (${parts.join(' · ')})</span>
                </div>
            `;
        }

        const recipeBadge = inRecipe
            ? '<span class="recipe-status in-recipe">In recipe ✓</span>'
            : canAddToRecipe
                ? `<button class="recipe-status-add" data-add-to-recipe="${key}">+ Add to recipe</button>`
                : '<span class="recipe-status not-in-recipe">Not in recipe</span>';

        return `
            <div class="supplier-row ${isPremium ? 'is-premium' : ''} ${!inRecipe ? 'not-used' : ''}" data-supplier="${key}">
                <div class="supplier-head">
                    <span class="supplier-name">${supplier.icon} ${supplier.name}${isPremium ? ' <span class="premium-star">★</span>' : ''}</span>
                    <span class="supplier-unit-price">
                        $<span data-unit>${unitPrice.toFixed(2)}</span>/unit
                        ${marketArrow}
                    </span>
                </div>
                <div class="supplier-meta">
                    <p class="supplier-desc">${supplier.description}</p>
                    ${recipeBadge}
                </div>
                ${tierSwitchHTML}
                <div class="supplier-slider-wrap">
                    <input type="range" min="1" max="50" step="1" value="${qty}" class="supplier-slider">
                    <div class="supplier-quantity-row">
                        <span class="supplier-quantity">
                            <span class="qty-value" data-qty>${qty}</span> units
                        </span>
                        <span class="supplier-tier-badge ${bulkClass}" data-tier>${bulk.label}</span>
                    </div>
                </div>
                <div class="supplier-footer">
                    <span class="supplier-total" data-total>$${total.toFixed(2)}</span>
                    <button class="arcade-button primary supplier-buy" data-supplier="${key}">Buy ${qty}</button>
                </div>
            </div>
        `;
    }

    refreshSupplierRow(key, qty) {
        const supplier = GameData.supplierTypes[key];
        const market = (this.gameState.marketPrices || GameData.defaultMarketPrices())[key] ?? 1.0;
        const row = document.querySelector(`.supplier-row[data-supplier="${key}"]`);
        if (!row || !supplier) return;

        const bulk = GameData.getSupplyTier(qty);
        const tiers = this.gameState.setup.supplierTiers || GameData.defaultSupplierTiers();
        const premiumMult = tiers[key] === 'premium' ? GameData.premium.multiplier : 1.0;
        const unitPrice = (supplier.basePrice / 10) * bulk.mult * market * premiumMult;
        const total = unitPrice * qty;

        row.querySelector('[data-qty]').textContent = qty;
        row.querySelector('[data-unit]').textContent = unitPrice.toFixed(2);
        row.querySelector('[data-total]').textContent = `$${total.toFixed(2)}`;
        const badge = row.querySelector('[data-tier]');
        badge.textContent = bulk.label;
        badge.className = 'supplier-tier-badge ' + (bulk.mult < 1 ? 'bulk' : bulk.mult > 1 ? 'surcharge' : '');

        const buyBtn = row.querySelector('.supplier-buy');
        if (buyBtn) buyBtn.textContent = `Buy ${qty}`;
    }

    // Update upgrade buttons
    updateUpgradeButtons() {
        const upgradeButtons = document.querySelectorAll('.upgrade-button');
        upgradeButtons.forEach(button => {
            const upgradeType = button.dataset.upgrade;
            if (this.gameState.upgrades[upgradeType]) {
                button.textContent = 'Purchased';
                button.disabled = true;
            }
        });
    }

    // Legacy entry point kept for GameController. The summary now lives in the
    // day-recap modal; this just pops it open for the newest journal entry.
    updateDailySummary() {
        const hist = this.gameState.history || [];
        if (hist.length === 0) return;
        const latest = hist[hist.length - 1];
        this.openDayModal(latest.day);
    }

    // Update all displays (useful for initialization and loading)
    updateAllDisplays() {
        this.updateMoney(this.gameState.money);
        this.updateReputation(this.gameState.reputation);
        this.updateDay(this.gameState.day);
        this.updateBusinessInfo();
        this.updateEmployeesList();
        this.updateEmployeeTypeSelect();
        this.updateRecipePanel();
        this.updateInventoryPanel();
        this.updatePricingPanel();
        this.updateFinancesPanel();
        this.updateSuppliersTab();
        this.updateJournal();
        this.updateNewsTicker();
        this.updateMarketingButtons();
        this.updateUpgradeButtons();
        this.updateFollowerDisplay();
        this.updateStorefrontVisual();
        this.updateBusinessProgression();
    }

    // Live economics: sell / cost / profit / break-even. Recomputed on every
    // recipe, tier, market, or price change via the 'setup'/'marketPrices' observers.
    updatePricingPanel() {
        if (!this.elements.currentPrice) return;
        const food = GameData.getFoodTypeData(this.gameState.setup.foodType);
        if (!food) return;

        const setup = this.gameState.setup;
        const mult = setup.priceMultiplier || 1.0;

        // Sell price — base + meal + addon bonuses, then multiplier.
        let itemPrice = food.basePrice + (setup.mealMode ? GameData.mealBonus : 0);
        (setup.recipe || []).forEach(ing => {
            const a = GameData.recipeAddons[ing];
            if (a?.priceBonus) itemPrice += a.priceBonus;
        });
        const sellPrice = itemPrice * mult;

        // Cost / profit / break-even via BusinessLogic. Guard in case it's not wired.
        const bl = this.businessLogic;
        const costPerSale = bl ? bl.calculatePerSaleIngredientCost() : 0;
        const profit = sellPrice - costPerSale;
        const breakEven = bl ? bl.calculateBreakEvenPrice() : costPerSale;

        // Sell price + hint.
        this.elements.currentPrice.textContent = `$${sellPrice.toFixed(2)}`;
        let sellHint;
        if (mult < 0.85)      sellHint = 'Cheap — buyers flock';
        else if (mult < 0.95) sellHint = 'Below base — more buyers';
        else if (mult < 1.05) sellHint = 'Base price — balanced';
        else if (mult < 1.2)  sellHint = 'Above base — some walk away';
        else                  sellHint = 'Pricey — most buyers balk';
        if (setup.mealMode) sellHint += ' · meal deal';
        this.elements.priceHint.textContent = sellHint;

        // Cost per sale — with a short breakdown.
        if (this.elements.costPerSale) {
            this.elements.costPerSale.textContent = `$${costPerSale.toFixed(2)}`;
            const ingredientPortion = Math.max(0, costPerSale - 0.4);
            this.elements.costHint.textContent =
                `$${ingredientPortion.toFixed(2)} ingredients + $0.40 packaging`;
        }

        // Profit per sale — green if positive, coral if negative.
        if (this.elements.profitPerSale) {
            const el = this.elements.profitPerSale;
            const sign = profit >= 0 ? '+' : '-';
            el.textContent = `${sign}$${Math.abs(profit).toFixed(2)}`;
            el.classList.toggle('profit-positive', profit >= 0);
            el.classList.toggle('profit-negative', profit < 0);
            const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
            this.elements.profitHint.textContent = profit >= 0
                ? `${margin.toFixed(0)}% margin on each sale`
                : `Losing money on every sale`;
        }

        // Break-even price — at your expected daily volume.
        if (this.elements.breakEvenPrice) {
            this.elements.breakEvenPrice.textContent = `$${breakEven.toFixed(2)}`;
            const diff = sellPrice - breakEven;
            let msg;
            if (Math.abs(diff) < 0.25) {
                msg = 'About even — no cushion, no bleed';
            } else if (diff > 0) {
                msg = `You're $${diff.toFixed(2)} above break-even`;
            } else {
                msg = `Charge $${(-diff).toFixed(2)} more (or cut costs) to break even`;
            }
            this.elements.breakEvenHint.textContent = msg;
        }
    }

    // Break down the monthly overhead so the player sees exactly what they pay.
    updateFinancesPanel() {
        if (!this.elements.financesGrid) return;

        const businessType = this.gameState.business.type;
        const fixed = GameData.getFixedCosts(businessType);
        const location = this.gameState.setup.location;
        let rent = location?.modifiers?.rentCost || 500;
        if (businessType === 'restaurant') rent *= 2.5;
        else if (businessType === 'chain') rent *= 4;

        const employeeMonthly = this.gameState.employees.reduce((sum, e) => {
            const data = GameData.getEmployeeType(e.type);
            return sum + (data?.salary || 0);
        }, 0);

        const marketing = this.gameState.marketing.hasSocialMediaAds
            ? GameData.marketingOptions.socialMediaAds.cost : 0;

        const lines = [
            { label: 'Rent',              value: rent },
            { label: 'Vehicle payment',   value: fixed.vehiclePayment },
            { label: 'Business license',  value: fixed.businessLicense },
            { label: 'Food permit',       value: fixed.foodPermit },
            { label: 'Insurance',         value: fixed.insurance },
            { label: 'Employees',         value: employeeMonthly },
        ];
        if (marketing > 0) lines.push({ label: 'Social media ads', value: marketing });

        const visible = lines.filter(l => l.value > 0);
        const total = visible.reduce((s, l) => s + l.value, 0);
        const food = GameData.getFoodTypeData(this.gameState.setup.foodType);
        const mult = this.gameState.setup.priceMultiplier || 1.0;
        const meal = this.gameState.setup.mealMode ? GameData.mealBonus : 0;
        const price = food ? (food.basePrice + meal) * mult : 0;
        const breakevenSales = price > 0 ? Math.ceil(total / price) : 0;

        this.elements.financesGrid.innerHTML = visible.map(l => `
            <div class="finances-row">
                <span class="label">${l.label}</span>
                <span class="value">$${l.value.toLocaleString()}/mo</span>
            </div>
        `).join('');

        this.elements.financesSummary.innerHTML = `
            <p>Total monthly overhead: <span class="total">$${total.toLocaleString()}</span></p>
            <p>That's roughly <span class="total">$${Math.round(total / 30).toLocaleString()}/day</span> before you sell a thing.</p>
            <p>Break-even: <span class="breakeven">${breakevenSales} sales/month</span> (~${Math.ceil(breakevenSales / 30)}/day)</p>
        `;
    }

    // Show notification to user
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);
        this.activeNotifications.push(notification);
        this.restackNotifications();

        setTimeout(() => notification.classList.add('show'), 50);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
                this.restackNotifications();
            }, 300);
        }, 3000);
    }

    // Short full-screen burst for big milestones (reputation tiers, cash
    // milestones, millionaire). Skips falling particles under reduced-motion,
    // keeping just the brief flash.
    celebrate() {
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const overlay = document.createElement('div');
        overlay.className = 'celebrate-overlay';

        let html = '<div class="celebrate-flash"></div>';
        if (!reducedMotion) {
            const particles = ['🎉', '✨', '⭐', '🏆', '💰'];
            for (let i = 0; i < 16; i++) {
                const left = Math.random() * 100;
                const delay = (Math.random() * 0.3).toFixed(2);
                const duration = (0.9 + Math.random() * 0.6).toFixed(2);
                const emoji = particles[Math.floor(Math.random() * particles.length)];
                html += `<span class="celebrate-particle" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s;">${emoji}</span>`;
            }
        }
        overlay.innerHTML = html;

        document.body.appendChild(overlay);
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 1400);
    }

    // Stack notifications vertically so they don't overlap
    restackNotifications() {
        let offset = 20;
        this.activeNotifications.forEach(n => {
            n.style.top = `${offset}px`;
            offset += n.offsetHeight + 12;
        });
    }

    // Show confirmation dialog
    showConfirmation(message, onConfirm, onCancel) {
        const result = confirm(message);
        if (result && onConfirm) {
            onConfirm();
        } else if (!result && onCancel) {
            onCancel();
        }
        return result;
    }

    // Handle tab switching
    switchTab(tabName) {
        // Remove active class from all tabs and buttons
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        this.elements.menuButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected tab and button
        const targetTab = document.getElementById(`${tabName}Tab`);
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetButton) targetButton.classList.add('active');
    }

    // Update employee type dropdown
    updateEmployeeTypeSelect() {
        if (!this.elements.employeeTypeSelect) return;

        const businessType = this.gameState.business.type;
        const availableEmployees = GameData.getAvailableEmployeeTypes(businessType);
        
        const options = Object.entries(availableEmployees).map(([type, data]) => {
            const currentCount = GameData.getEmployeeCount(type, this.gameState.employees);
            const maxCount = data.maxCount[businessType];
            const canHire = GameData.canHireEmployee(type, this.gameState.employees, businessType);
            
            const statusText = canHire ? 
                `(${currentCount}/${maxCount})` : 
                `(MAX: ${currentCount}/${maxCount})`;
                
            return `<option value="${type}" ${!canHire ? 'disabled' : ''}>${data.name} - $${data.salary.toLocaleString()}/month ${statusText}</option>`;
        }).join('');

        this.elements.employeeTypeSelect.innerHTML = options;
    }

    // Enable/disable buttons based on game state
    updateButtonStates() {
        // Update hire employee button
        if (this.elements.hireEmployeeButton && this.elements.employeeTypeSelect) {
            const selectedType = this.elements.employeeTypeSelect.value;
            const empData = GameData.getEmployeeType(selectedType);
            const canAfford = empData && this.gameState.money >= empData.salary;
            
            this.elements.hireEmployeeButton.disabled = !canAfford;
            if (!canAfford && empData) {
                this.elements.hireEmployeeButton.title = `Need $${empData.salary.toLocaleString()} to hire`;
            } else {
                this.elements.hireEmployeeButton.title = '';
            }
        }

        // Update upgrade buttons
        document.querySelectorAll('.upgrade-button').forEach(button => {
            const upgradeType = button.dataset.upgrade;
            const upgradeData = GameData.getUpgradeType(upgradeType);
            
            if (upgradeData && !this.gameState.upgrades[upgradeType]) {
                const canAfford = this.gameState.money >= upgradeData.cost;
                button.disabled = !canAfford;
                if (!canAfford) {
                    button.title = `Need $${upgradeData.cost.toLocaleString()}`;
                } else {
                    button.title = '';
                }
            }
        });
    }

    // Initialize UI after game setup
    initializeGameUI() {
        this.updateAllDisplays();
        this.updateEmployeeTypeSelect();
        this.updateButtonStates();
        this.updateBusinessProgression();
        this.updateFollowerDisplay();
    }
}

// Export for module usage
window.UIManager = UIManager;