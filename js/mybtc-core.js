/**
 * mybtc-core.js
 * Core functionality for myBTC Calculator
 * Contains global variables, basic configurations, formatting and calculation functions
 */

// Create namespace
window.MYBTC = window.MYBTC || {};

// Core module
window.MYBTC.Core = (function() {
    // ==============================================
    // PRIVATE VARIABLES
    // ==============================================
    
    // Language and period settings
    let currentLang = 'en';
    let earliestPrice = null;
    let earliestTimestamp = null;
    let selectedPeriod = '1Y';

    // Price tracking variables
    let currentPriceUSD = null;
    let currentPriceBRL = null;
    let currentPriceEUR = null;
    let currentPriceGBP = null;
    let currentPriceChangePercent = null;
    let currentAmount = null;
    let btcUnit = 'BTC';
    let fiatUnit = 'USD';

    // Currency configuration
    const supportedCurrencies = {
        'USD': { symbol: '$', pair: 'USDTUSDT' }, // Special case - will use direct BTC price
        'BRL': { symbol: 'R$', pair: 'USDTBRL' },
        'EUR': { symbol: '€', pair: 'USDTEUR' },
        'GBP': { symbol: '£', pair: 'USDTGBP' }
    };

    // Period settings
    const periodCodes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', 'YTD'];
    const periodToDaysAgo = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '2Y': 730,
        '5Y': 1825,
    };

    // Standard formatters
    const fiatFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const btcFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
    });

    // ==============================================
    // PRIVATE FUNCTIONS
    // ==============================================

    /**
     * Format a number with commas as thousand separators
     * @param {string} value - The value to format
     * @param {string} unit - The unit (BTC, SATS, USD, BRL, EUR, GBP, CAD)
     * @returns {string} Formatted number
     */
    function formatNumberWithCommas(value, unit) {
        if (unit === 'BTC') {
            // For BTC, format with 8 decimals and commas for thousands
            const parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        } else if (unit === 'SATS') {
            // For SATS, format with commas for thousands (no decimals)
            return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            // For fiat currencies, format with 2 decimals and commas for thousands
            const parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            if (parts.length > 1) {
                // Ensure exactly 2 decimal places for fiat
                parts[1] = parts[1].padEnd(2, '0').substring(0, 2);
            } else {
                parts.push('00');
            }
            return parts.join('.');
        }
    }

    /**
     * Format satoshis with commas
     * @param {number} number - The number to format
     * @returns {string} Formatted number
     */
    function formatSats(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Count the number of digits in a text
     * @param {string} text - The text to analyze
     * @returns {number} Number of digits
     */
    function countDigits(text) {
        return text.replace(/[^0-9]/g, '').length;
    }

    /**
     * Calculate font size for BTC/SATS display based on digit count and screen width
     * @param {number} digitCount - Number of digits
     * @returns {number} Font size in pixels
     */
    function getFontSizeBtcSats(digitCount) {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 520) return 50;
        
        const fontSizeTable = {
            'case1': { maxWidth: 519, minWidth: 430, sizes: { 9: 50, 10: 46, 11: 42, 12: 38 } },
            'case2': { maxWidth: 429, minWidth: 375, sizes: { 9: 42.5, 10: 39.1, 11: 35.7, 12: 32.3 } },
            'case3': { maxWidth: 374, minWidth: 320, sizes: { 9: 35, 10: 32.2, 11: 29.4, 12: 26.6 } }
        };
        
        let caseKey = screenWidth >= 430 ? 'case1' : screenWidth >= 375 ? 'case2' : 'case3';
        const effectiveDigitCount = Math.min(digitCount, 12);
        const sizeKey = effectiveDigitCount <= 9 ? 9 : effectiveDigitCount;
        
        return fontSizeTable[caseKey].sizes[sizeKey] || fontSizeTable[caseKey].sizes[12];
    }

    /**
     * Calculate font size for USD/BRL display based on digit count and screen width
     * @param {number} digitCount - Number of digits
     * @returns {number} Font size in pixels
     */
    function getFontSizeUsdBrl(digitCount) {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 520) return 50;
        
        const fontSizeTable = {
            'case1': { maxWidth: 519, minWidth: 430, sizes: { 8: 50, 9: 46, 10: 42, 11: 38 } },
            'case2': { maxWidth: 429, minWidth: 375, sizes: { 8: 42.5, 9: 39.1, 10: 35.7, 11: 32.3 } },
            'case3': { maxWidth: 374, minWidth: 320, sizes: { 8: 35, 9: 32.2, 10: 29.4, 11: 26.6 } }
        };
        
        let caseKey = screenWidth >= 430 ? 'case1' : screenWidth >= 375 ? 'case2' : 'case3';
        const effectiveDigitCount = Math.min(digitCount, 11);
        const sizeKey = effectiveDigitCount <= 8 ? 8 : effectiveDigitCount;
        
        return fontSizeTable[caseKey].sizes[sizeKey] || fontSizeTable[caseKey].sizes[11];
    }

    /**
     * Get the current price for the specified currency
     * @param {string} currency - Currency code (USD, BRL, EUR, GBP, CAD)
     * @returns {number|null} Current price or null if not available
     */
    function getCurrentPrice(currency) {
        switch (currency) {
            case 'USD': return currentPriceUSD;
            case 'BRL': return currentPriceBRL;
            case 'EUR': return currentPriceEUR;
            case 'GBP': return currentPriceGBP;
            default: return null;
        }
    }

    /**
     * Set the current price for the specified currency
     * @param {string} currency - Currency code (USD, BRL, EUR, GBP, CAD)
     * @param {number} price - Price to set
     */
    function setCurrentPrice(currency, price) {
        switch (currency) {
            case 'USD': currentPriceUSD = price; break;
            case 'BRL': currentPriceBRL = price; break;
            case 'EUR': currentPriceEUR = price; break;
            case 'GBP': currentPriceGBP = price; break;
        }
    }

    /**
     * Get the translation for the current language
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    function getTranslation(key) {
        return translations[currentLang][key] || key;
    }

    /**
     * Set the application language
     * @param {string} lang - Language code ('en' or 'pt')
     */
    function setLanguage(lang) {
        currentLang = lang;
        
        // Update all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.innerHTML = translations[lang][key];
        });
        
        // Update language buttons
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-lang') === lang);
        });
    }

    // ==============================================
    // PUBLIC API
    // ==============================================
    return {
        // Variables
        get currentLang() { return currentLang; },
        set currentLang(value) { currentLang = value; },
        
        get earliestPrice() { return earliestPrice; },
        set earliestPrice(value) { earliestPrice = value; },
        
        get earliestTimestamp() { return earliestTimestamp; },
        set earliestTimestamp(value) { earliestTimestamp = value; },
        
        get selectedPeriod() { return selectedPeriod; },
        set selectedPeriod(value) { selectedPeriod = value; },
        
        get currentPriceUSD() { return currentPriceUSD; },
        set currentPriceUSD(value) { currentPriceUSD = value; },
        
        get currentPriceBRL() { return currentPriceBRL; },
        set currentPriceBRL(value) { currentPriceBRL = value; },
        
        get currentPriceEUR() { return currentPriceEUR; },
        set currentPriceEUR(value) { currentPriceEUR = value; },
        
        get currentPriceGBP() { return currentPriceGBP; },
        set currentPriceGBP(value) { currentPriceGBP = value; },
        
        get currentPriceChangePercent() { return currentPriceChangePercent; },
        set currentPriceChangePercent(value) { currentPriceChangePercent = value; },
        
        get currentAmount() { return currentAmount; },
        set currentAmount(value) { currentAmount = value; },
        
        get btcUnit() { return btcUnit; },
        set btcUnit(value) { btcUnit = value; },
        
        get fiatUnit() { return fiatUnit; },
        set fiatUnit(value) { fiatUnit = value; },
        
        // Constants
        supportedCurrencies,
        periodCodes,
        periodToDaysAgo,
        fiatFormatter,
        btcFormatter,
        
        // Functions
        formatNumberWithCommas,
        formatSats,
        countDigits,
        getFontSizeBtcSats,
        getFontSizeUsdBrl,
        getCurrentPrice,
        setCurrentPrice,
        getTranslation,
        setLanguage
    };
})();