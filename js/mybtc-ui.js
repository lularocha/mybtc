/**
 * mybtc-ui.js
 * UI functionality for myBTC Calculator
 * Contains UI manipulation, keypad functions, display management and event listeners
 */

// Create namespace
window.MYBTC = window.MYBTC || {};

// UI module
window.MYBTC.UI = (function() {
    // Get access to other modules
    const Core = window.MYBTC.Core;
    const API = window.MYBTC.API;
    
    // ==============================================
    // PRIVATE VARIABLES
    // ==============================================
    
    // Keypad variables
    let activeField = 'btc';
    let tempValue = '0';    // Stores input during editing
    let previousValue = '0'; // Stores value before editing
    let modal = null;
    
    // ==============================================
    // PRIVATE FUNCTIONS
    // ==============================================
    
    /**
     * Update the main display with current values
     */
    function updateDisplay() {
        // Update period label
        const periodLabel = translations[Core.currentLang].periodLabels[Core.selectedPeriod];
        document.getElementById('current-BTC-change-label').textContent = periodLabel;
        
        // Get current price and symbol for selected currency
        const price = Core.getCurrentPrice(Core.fiatUnit);
        const symbol = Core.supportedCurrencies[Core.fiatUnit].symbol;

        // Update BTC price display
        const priceElement = document.getElementById('current-BTC-price-display');
        priceElement.querySelector('.USDBRL-symbol').textContent = symbol;
        const priceAmountSpan = priceElement.querySelector('.current-BTC-price-amount');
        priceAmountSpan.textContent = price !== null ? Core.fiatFormatter.format(price) : 'Error fetching price';

        // Update BTC/SATS amount display
        const btcDisplaySpan = document.querySelector('#BTC-amount-display .BTC-amount');
        let displayAmount;
        if (Core.currentAmount !== null) {
            displayAmount = Core.btcUnit === 'BTC' 
                ? Core.btcFormatter.format(Core.currentAmount) 
                : Core.formatSats(Math.round(Core.currentAmount * 100000000));
        } else {
            displayAmount = Core.btcUnit === 'BTC' ? Core.btcFormatter.format(0) : '000,000,000';
        }
        btcDisplaySpan.textContent = displayAmount;

        // Update Fiat amount display
        const fiatSymbolSpan = document.querySelector('#USDBRL-amount-display .USDBRL-symbol');
        fiatSymbolSpan.textContent = symbol;
        const fiatAmountSpan = document.querySelector('#USDBRL-amount-display .USDBRL-amount');
        fiatAmountSpan.textContent = price && Core.currentAmount ? Core.fiatFormatter.format(Core.currentAmount * price) : '0.00';

        // Update price change display
        const changeDisplay = document.getElementById('current-BTC-change-display');
        const arrowSpan = changeDisplay.querySelector('.arrow-symbol');
        const percentSpan = changeDisplay.querySelector('.current-BTC-change-amount');
        
        if (Core.currentPriceChangePercent !== null) {
            const arrow = Core.currentPriceChangePercent >= 0 ? '↑' : '↓';
            const absPercent = Math.abs(Core.currentPriceChangePercent).toFixed(1);
            arrowSpan.textContent = arrow;
            percentSpan.textContent = `${absPercent}%`;
            changeDisplay.style.color = Core.currentPriceChangePercent >= 0 ? '#090' : '#f00';
        } else {
            arrowSpan.textContent = '';
            percentSpan.textContent = 'N/A';
            changeDisplay.style.color = '#000';
        }

        // Adjust font sizes based on content length
        const btcText = btcDisplaySpan.textContent;
        btcDisplaySpan.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(btcText))}px`;

        const fiatText = fiatAmountSpan.textContent;
        const fontSize = Core.getFontSizeUsdBrl(Core.countDigits(fiatText));
        fiatAmountSpan.style.fontSize = `${fontSize}px`;
        fiatSymbolSpan.style.fontSize = `${fontSize}px`;
    }
    
    /**
     * Update the unit buttons to reflect current selection
     */
    function updateUnitButtons() {
        // Update BTC unit buttons
        document.querySelector('.btc-btn').classList.toggle('active', Core.btcUnit === 'BTC');
        document.querySelector('.sats-btn').classList.toggle('active', Core.btcUnit === 'SATS');
        
        // Update fiat unit buttons
        Object.keys(Core.supportedCurrencies).forEach(currency => {
            const button = document.querySelector(`.${currency.toLowerCase()}-btn`);
            if (button) {
                button.classList.toggle('active', Core.fiatUnit === currency);
            }
        });
    }
    
    /**
     * Update the equivalent value in real-time during input
     */
    function updateEquivalentValue() {
        // Skip if no price is available for current currency
        const currentPrice = Core.getCurrentPrice(Core.fiatUnit);
        if (!currentPrice) {
            return;
        }
        
        // Get the current value without commas
        const currentValue = tempValue.replace(/,/g, '');
        
        if (activeField === 'btc') {
            // Calculate fiat equivalent
            let btcAmount;
            if (Core.btcUnit === 'BTC') {
                btcAmount = parseFloat(currentValue) || 0;
            } else { // SATS
                btcAmount = (parseInt(currentValue, 10) || 0) / 100000000;
            }
            
            // Calculate fiat value
            const fiatValue = btcAmount * currentPrice;
            
            // Update fiat display
            const fiatDisplaySpan = document.querySelector('#USDBRL-amount-display .USDBRL-amount');
            fiatDisplaySpan.textContent = Core.fiatFormatter.format(fiatValue);
            
            // Update font size of the fiat display
            const fontSize = Core.getFontSizeUsdBrl(Core.countDigits(fiatDisplaySpan.textContent));
            fiatDisplaySpan.style.fontSize = `${fontSize}px`;
            document.querySelector('#USDBRL-amount-display .USDBRL-symbol').style.fontSize = `${fontSize}px`;
        } else { // fiat is active
            // Calculate BTC equivalent
            const fiatValue = parseFloat(currentValue) || 0;
            const btcValue = fiatValue / currentPrice;
            
            // Update BTC display
            const btcDisplaySpan = document.querySelector('#BTC-amount-display .BTC-amount');
            if (Core.btcUnit === 'BTC') {
                btcDisplaySpan.textContent = Core.btcFormatter.format(btcValue);
            } else { // SATS
                btcDisplaySpan.textContent = Core.formatSats(Math.round(btcValue * 100000000));
            }
            
            // Update font size of the BTC display
            const fontSize = Core.getFontSizeBtcSats(Core.countDigits(btcDisplaySpan.textContent));
            btcDisplaySpan.style.fontSize = `${fontSize}px`;
        }
    }
    
    /**
     * Update the font size of an input element
     * @param {HTMLElement} inputElement - The input element
     * @param {string} unit - The unit being displayed
     */
    function updateInputFontSize(inputElement, unit) {
        let text = inputElement.value;
        if (unit === 'BTC' || unit === 'SATS') {
            inputElement.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(text))}px`;
        } else if (Object.keys(Core.supportedCurrencies).includes(unit)) {
            inputElement.style.fontSize = `${Core.getFontSizeUsdBrl(Core.countDigits(text))}px`;
        }
    }
    
    /**
     * Open the keypad modal for input
     * @param {string} field - Field to edit ('btc' or 'fiat')
     */
    function openModal(field) {
        activeField = field;
        
        // Show the appropriate input field and hide the display
        const btcDisplay = document.getElementById('BTC-amount-display');
        const fiatDisplay = document.getElementById('USDBRL-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        const fiatInput = document.querySelector('.fiat-input');

        const mainContainer = document.querySelector('.main-container');
        mainContainer.classList.add('slide-up');
        
        if (field === 'btc') {
            // Show BTC input field
            btcDisplay.style.display = 'none';
            btcInput.style.display = 'block';
            
            // Set the initial value
            if (Core.currentAmount !== null) {
                if (Core.btcUnit === 'BTC') {
                    tempValue = Core.currentAmount.toFixed(8);
                    // Remove trailing zeros after decimal point
                    tempValue = tempValue.replace(/\.?0+$/, '');
                    if (tempValue === '') tempValue = '0';
                } else {
                    tempValue = Math.round(Core.currentAmount * 100000000).toString();
                    if (tempValue === '') tempValue = '0';
                }
            } else {
                tempValue = '0';
            }
            
            // Format the value with commas
            const formattedValue = Core.formatNumberWithCommas(tempValue, Core.btcUnit);
            btcInput.value = formattedValue;
            updateInputFontSize(btcInput, Core.btcUnit);
        } else { // fiat
            // Show fiat input field
            fiatDisplay.style.display = 'none';
            fiatInput.style.display = 'block';
            
            // Set the initial value
            const currentPrice = Core.getCurrentPrice(Core.fiatUnit);
            if (Core.currentAmount !== null && currentPrice) {
                tempValue = (currentPrice * Core.currentAmount).toFixed(2);
                // Remove trailing zeros after decimal point for display only
                tempValue = tempValue.replace(/\.?0+$/, '');
                if (tempValue === '') tempValue = '0';
            } else {
                tempValue = '0';
            }
            
            // Format the value with commas
            const formattedValue = Core.formatNumberWithCommas(tempValue, Core.fiatUnit);
            fiatInput.value = formattedValue;
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        
        previousValue = tempValue;
        
        // Show the modal with animation
        modal.style.display = 'flex';
        
        // Trigger animation after a short delay to ensure display:flex is applied
        setTimeout(() => {
            modal.classList.add('open');
        }, 10);
        
        // Prevent scrolling when keypad is open
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close the keypad modal
     */
    function closeModal() {
        const mainContainer = document.querySelector('.main-container');
        mainContainer.classList.remove('slide-up');

        // Animate out
        modal.classList.remove('open');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            // Re-enable scrolling when keypad is closed
            document.body.style.overflow = '';
        }, 300); // Match the CSS transition duration (0.3s = 300ms)
    }
    
    /**
     * Append a character to the current input
     * @param {string} value - Character to append
     */
    function appendToDisplay(value) {
        // Get the current input value without commas
        let currentValue = tempValue.replace(/,/g, '');
        
        if (currentValue === '0' && value !== '.') {
            currentValue = value;
        } else if (value === '.' && currentValue.includes('.')) {
            return;
        } else {
            currentValue += value;
        }
        
        // Format the value based on the field and unit
        if (activeField === 'btc') {
            if (Core.btcUnit === 'BTC') {
                // For BTC, limit to 8 decimal places
                let parts = currentValue.split('.');
                if (parts.length > 1 && parts[1].length > 8) {
                    parts[1] = parts[1].substring(0, 8);
                    currentValue = parts.join('.');
                }
            } else {
                // For SATS, no decimal places allowed
                currentValue = currentValue.replace(/\D/g, '');
            }
            
            // Format the value with commas
            tempValue = currentValue;
            const formattedValue = Core.formatNumberWithCommas(currentValue, Core.btcUnit);
            
            // Update the BTC input field with formatted value
            const btcInput = document.querySelector('.BTC-input');
            btcInput.value = formattedValue;
            updateInputFontSize(btcInput, Core.btcUnit);
        } else {
            // For fiat, limit to 2 decimal places
            let parts = currentValue.split('.');
            if (parts.length > 1 && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
                currentValue = parts.join('.');
            }
            
            // Format the value with commas
            tempValue = currentValue;
            const formattedValue = Core.formatNumberWithCommas(currentValue, Core.fiatUnit);
            
            // Update the fiat input field with formatted value
            const fiatInput = document.querySelector('.fiat-input');
            fiatInput.value = formattedValue;
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        
        // Update the equivalent value
        updateEquivalentValue();
    }
    
    /**
     * Delete the last character from the current input
     */
    function deleteLast() {
        // Remove the commas first
        let currentValue = tempValue.replace(/,/g, '');
        
        // Delete the last character
        currentValue = currentValue.slice(0, -1);
        if (currentValue === '') {
            currentValue = '0';
        }
        
        // Update tempValue without commas
        tempValue = currentValue;
        
        // Update the appropriate input field with formatted value
        if (activeField === 'btc') {
            const formattedValue = Core.formatNumberWithCommas(currentValue, Core.btcUnit);
            const btcInput = document.querySelector('.BTC-input');
            btcInput.value = formattedValue;
            updateInputFontSize(btcInput, Core.btcUnit);
        } else {
            const formattedValue = Core.formatNumberWithCommas(currentValue, Core.fiatUnit);
            const fiatInput = document.querySelector('.fiat-input');
            fiatInput.value = formattedValue;
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        
        // Update the equivalent value
        updateEquivalentValue();
    }
    
    /**
     * Cancel input and close the modal
     */
    function cancelInput() {
        tempValue = previousValue;
        closeModal();
        
        // Hide inputs and show displays again
        const btcDisplay = document.getElementById('BTC-amount-display');
        const fiatDisplay = document.getElementById('USDBRL-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        const fiatInput = document.querySelector('.fiat-input');
        
        btcInput.style.display = 'none';
        fiatInput.style.display = 'none';
        btcDisplay.style.display = 'flex';
        fiatDisplay.style.display = 'flex';
    }
    
    /**
     * Submit the current input and update values
     */
    function submitInput() {
        if (activeField === 'btc') {
            if (Core.btcUnit === 'BTC') {
                Core.currentAmount = parseFloat(tempValue) || 0;
            } else { // SATS
                Core.currentAmount = (parseInt(tempValue, 10) || 0) / 100000000;
            }
        } else { // Fiat
            const price = Core.getCurrentPrice(Core.fiatUnit);
            if (price) {
                Core.currentAmount = (parseFloat(tempValue) || 0) / price;
            }
        }
        
        // Hide inputs and show displays again
        const btcDisplay = document.getElementById('BTC-amount-display');
        const fiatDisplay = document.getElementById('USDBRL-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        const fiatInput = document.querySelector('.fiat-input');
        
        btcInput.style.display = 'none';
        fiatInput.style.display = 'none';
        btcDisplay.style.display = 'flex';
        fiatDisplay.style.display = 'flex';
        
        closeModal();
        updateDisplay();
    }
    
    /**
     * Process BTC input field
     */
    function processBtcInput() {
        const btcInput = document.querySelector('.BTC-input');
        let value = btcInput.value.trim();
        
        if (value === '') {
            Core.currentAmount = null;
        } else {
            if (Core.btcUnit === 'BTC') {
                value = value.replace(/,/g, '');
                value = parseFloat(value);
                Core.currentAmount = !isNaN(value) && value >= 0 ? value : null;
            } else if (Core.btcUnit === 'SATS') {
                value = value.replace(/,/g, '');
                value = parseInt(value, 10);
                Core.currentAmount = !isNaN(value) && value >= 0 ? value / 100000000 : null;
            }
        }
        updateDisplay();
    }
    
    /**
     * Process fiat input field
     */
    function processFiatInput() {
        const fiatInput = document.querySelector('.fiat-input');
        let value = fiatInput.value.trim().replace(/,/g, '');
        
        if (value === '') {
            Core.currentAmount = null;
        } else {
            value = parseFloat(value);
            if (!isNaN(value) && value >= 0) {
                const price = Core.getCurrentPrice(Core.fiatUnit);
                if (price) {
                    Core.currentAmount = value / price;
                } else {
                    Core.currentAmount = null;
                }
            } else {
                Core.currentAmount = null;
            }
        }
        updateDisplay();
    }
    
    /**
     * Set up the period selection menu
     */
    function setupPeriodMenu() {
        const periodMenu = document.getElementById('period-menu');
        
        // Create period buttons
        Core.periodCodes.forEach(code => {
            const button = document.createElement('button');
            button.textContent = translations[Core.currentLang].periodDisplayCodes[code];
            button.setAttribute('data-period', code);
            button.addEventListener('click', () => {
                Core.selectedPeriod = code;
                document.getElementById('current-BTC-change-label').textContent = translations[Core.currentLang].periodLabels[code];
                
                // Update selected button styling
                periodMenu.querySelectorAll('button').forEach(btn => {
                    btn.classList.toggle('selected', btn.getAttribute('data-period') === Core.selectedPeriod);
                });
                
                // Fetch historical price and update display
                API.fetchHistoricalBitcoinPrice(Core.selectedPeriod).then(historicalPrice => {
                    Core.currentPriceChangePercent = Core.currentPriceUSD && historicalPrice 
                        ? ((Core.currentPriceUSD - historicalPrice) / historicalPrice) * 100 
                        : null;
                    updateDisplay();
                });
                
                // Hide the menu
                periodMenu.classList.remove('active');
            });
            periodMenu.appendChild(button);
        });

        // Set initial selection (1Y)
        document.querySelector(`#period-menu button[data-period="1Y"]`).classList.add('selected');
        
        // Set up period change display click event
        const changeDisplay = document.getElementById('current-BTC-change-display');
        changeDisplay.setAttribute('role', 'button');
        changeDisplay.setAttribute('tabindex', '0');
        changeDisplay.addEventListener('click', () => periodMenu.classList.toggle('active'));
        changeDisplay.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault(); 
                periodMenu.classList.toggle('active'); 
            } 
        });
        
        // Close period menu when clicking outside
        document.addEventListener('click', (e) => { 
            if (!changeDisplay.contains(e.target) && !periodMenu.contains(e.target)) {
                periodMenu.classList.remove('active'); 
            }
        });
    }
    
    /**
     * Update period menu language
     */
    function updatePeriodMenuLanguage() {
        const periodMenu = document.getElementById('period-menu');
        
        // Update period menu buttons
        periodMenu.querySelectorAll('button').forEach(button => {
            const code = button.getAttribute('data-period');
            button.textContent = translations[Core.currentLang].periodDisplayCodes[code];
        });
        
        // Update current label
        if (Core.selectedPeriod) {
            document.getElementById('current-BTC-change-label').textContent = translations[Core.currentLang].periodLabels[Core.selectedPeriod];
        }
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Unit buttons
        const btcBtn = document.querySelector('.btc-btn');
        const satsBtn = document.querySelector('.sats-btn');
        
        btcBtn.addEventListener('click', () => { 
            Core.btcUnit = 'BTC'; 
            updateUnitButtons(); 
            updateDisplay(); 
        });
        
        satsBtn.addEventListener('click', () => { 
            Core.btcUnit = 'SATS'; 
            updateUnitButtons(); 
            updateDisplay(); 
        });

        // Fiat currency buttons
        Object.keys(Core.supportedCurrencies).forEach(currency => {
            const button = document.querySelector(`.${currency.toLowerCase()}-btn`);
            if (button) {
                button.addEventListener('click', () => { 
                    Core.fiatUnit = currency; 
                    updateUnitButtons(); 
                    updateDisplay(); 
                });
            }
        });

        // Display click handlers
        const btcDisplay = document.getElementById('BTC-amount-display');
        const fiatDisplay = document.getElementById('USDBRL-amount-display');
        
        btcDisplay.addEventListener('click', () => {
            openModal('btc');
        });
        
        fiatDisplay.addEventListener('click', () => {
            openModal('fiat');
        });

        // Legacy input handlers (for backward compatibility)
        const btcInput = document.querySelector('.BTC-input');
        const fiatInput = document.querySelector('.fiat-input');
        
        btcInput.addEventListener('blur', () => { 
            processBtcInput(); 
            btcInput.style.display = 'none'; 
            btcDisplay.style.display = 'flex'; 
        });
        
        btcInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') { 
                processBtcInput(); 
                btcInput.style.display = 'none'; 
                btcDisplay.style.display = 'flex'; 
            } 
        });
        
        fiatInput.addEventListener('blur', () => { 
            processFiatInput(); 
            fiatInput.style.display = 'none'; 
            fiatDisplay.style.display = 'flex'; 
        });
        
        fiatInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') { 
                processFiatInput(); 
                fiatInput.style.display = 'none'; 
                fiatDisplay.style.display = 'flex'; 
            } 
        });

        // Refresh button
        document.getElementById('refresh').addEventListener('click', async () => {
            const data = await API.fetchData();
            updateDisplay();
        });

        // Logo click handler
        document.querySelector('.mybtclogo').addEventListener('click', async () => {
            window.spinLogo();
            const data = await API.fetchData();
            updateDisplay();
        });

        // Set up period menu
        setupPeriodMenu();
        
        // Language switching
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.getAttribute('data-lang');
                Core.setLanguage(lang);
                
                // Update period menu buttons and current label
                updatePeriodMenuLanguage();
            });
        });

        // Handle window resize
        window.addEventListener('resize', updateDisplay);
    }
    
    /**
     * Initialize the application
     */
    async function init() {
        // Initialize modal reference
        modal = document.getElementById('keypadModal');
        
        // Get initial price data
        const data = await API.fetchData();
        
        updateDisplay();
        updateUnitButtons();
        
        // Add click event to close modal when clicking outside
        modal.addEventListener('click', function(event) {
            // Check if the click was directly on the modal background (not on its children)
            if (event.target === modal) {
                cancelInput();
            }
        });
        
        // Apply touch-action to all keypad buttons
        document.querySelectorAll('.keypad button').forEach(button => {
            button.style.touchAction = 'manipulation';
        });
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // ==============================================
    // PUBLIC API
    // ==============================================
    return {
        init,
        updateDisplay,
        updateUnitButtons,
        openModal,
        closeModal,
        appendToDisplay,
        deleteLast,
        cancelInput,
        submitInput,
        processBtcInput,
        processFiatInput
    };
})();

// ==============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE FOR HTML ONCLICK
// ==============================================

// Expose necessary functions globally for HTML onclick handlers
window.openModal = window.MYBTC.UI.openModal;
window.closeModal = window.MYBTC.UI.closeModal;
window.appendToDisplay = window.MYBTC.UI.appendToDisplay;
window.deleteLast = window.MYBTC.UI.deleteLast;
window.cancelInput = window.MYBTC.UI.cancelInput;
window.submitInput = window.MYBTC.UI.submitInput;

// ==============================================
// ENTRY POINT
// ==============================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.MYBTC.UI.init();
    
    // Initialize with default language
    window.MYBTC.Core.setLanguage('en');
});