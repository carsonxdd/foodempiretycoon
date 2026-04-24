/**
 * Main Application Entry Point
 * Food Empire Tycoon - Modular Version
 */

// Global game controller instance
let gameController;

// Populate the landing quote ticker with a mix of positive feedback lines,
// each attributed to a random name and a plausible early-game day.
// Uses CSS marquee — we duplicate the content so the loop seams invisibly.
function populateLandingTicker() {
    const track = document.getElementById('quoteTrack');
    if (!track || typeof GameData === 'undefined') return;

    const pools = GameData.positiveFeedback;
    const lines = [
        ...(pools.general || []),
        ...(pools.busy || []),
        ...(pools.viral || []),
        ...(pools.simpleLovers || []),
        ...(pools.loadedLovers || []),
    ];
    // Pick 8 distinct-ish quotes
    const shuffled = lines.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    const usedNames = [];
    const quotes = shuffled.map(text => {
        const name = GameData.getRandomName(usedNames);
        usedNames.push(name);
        const day = 5 + Math.floor(Math.random() * 90); // day 5-94
        return `<span class="quote-item">"${text}" <em>— ${name}, day ${day}</em></span>`;
    }).join('<span class="quote-sep">·</span>');

    // Duplicate content so the -50% translate loop seams cleanly.
    track.innerHTML = quotes + '<span class="quote-sep">·</span>' + quotes;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Landing ambience — independent of game init, so it shows even if game fails.
        populateLandingTicker();

        // Initialize the game controller
        gameController = new GameController();
        gameController.initialize();

        console.log('Food Empire Tycoon loaded successfully!');
        
        // Development mode helpers (remove in production)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.DEBUG = {
                gameState: () => gameController.gameState.getFullState(),
                addMoney: (amount) => gameController.gameState.addMoney(amount),
                setDay: (day) => gameController.gameState.state.day = day,
                resetGame: () => gameController.newGame(),
                businessLogic: gameController.businessLogic,
                uiManager: gameController.uiManager
            };
            console.log('Debug mode enabled. Use window.DEBUG for development tools.');
        }
        
    } catch (error) {
        console.error('Failed to initialize Food Empire Tycoon:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h2>Game Loading Error</h2>
            <p>Sorry, there was an error loading the game. Please refresh the page to try again.</p>
            <p>Error details: ${error.message}</p>
        `;
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff0000;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            font-family: 'VT323', monospace;
        `;
        
        document.body.appendChild(errorMessage);
    }
});

// Handle page visibility changes for auto-save
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && gameController) {
        // Auto-save when user switches tabs or minimizes window
        gameController.autoSave();
    }
});

// Handle page unload for final auto-save
window.addEventListener('beforeunload', () => {
    if (gameController) {
        gameController.autoSave();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't crash the game for minor errors
    if (gameController && gameController.uiManager) {
        gameController.uiManager.showNotification(
            'A minor error occurred. The game should continue normally.',
            'warning'
        );
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the default behavior
    
    if (gameController && gameController.uiManager) {
        gameController.uiManager.showNotification(
            'A background error occurred. The game should continue normally.',
            'warning'
        );
    }
});

// Prevent right-click context menu in production (optional)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Export for potential external access
window.FoodEmpire = {
    getGameController: () => gameController,
    version: '2.0.0',
    build: 'modular'
};