// Updated translations.js file with new infoModalText0
const translations = {
    en: {
        currentBitcoinPrice: 'Current Bitcoin Price',
        refreshPrice: 'refresh price',
        help: 'help',
        footerInfo: 'Click or tap the BTC/SATS or Fiat Currency display to enter an amounts.',
        howToUse: 'How to use:',
        instruction1: 'Use the EN/PT buttons to select the language: English or Portuguese',
        instruction2: 'Use the BTC/SATS buttons or Fiat Currency USD BRL EUR GBP buttons to select the desired unit',
        instruction3: 'Click or tap the BTC/SATS display or fiat currency display to enter amount and press OK to update the dashboard',
        instruction4: 'Click or tap the Refresh Price button to update the current Bitcoin price',
        instruction5: 'Click or tap the Return % value to select a different period',
        instruction6: '<a href="https://21bitcoin.info" target="_blank">Learn Bitcoin</a>',
        infoModalText0: 'You can buy small pieces of Bitcoin!',
        infoModalText1: 'A Satoshi – also known as "SAT" – is a very small fraction of a Bitcoin. It is equal to 0.00000001 Bitcoin.',
        infoModalText2: 'Just as 1 Dollar can be divided into 100 cents, 1 Bitcoin can be divided into 100 million satoshis.',
        infoModalText3: 'This means that:<br>1 Bitcoin = 100 million SATS.',
        periodDisplayCodes: {
            '1D': '1D',
            '1W': '1W',
            '1M': '1M',
            '3M': '3M',
            '6M': '6M',
            '1Y': '1Y',
            '2Y': '2Y',
            '5Y': '5Y',
            'YTD': 'YTD'
        },
        periodLabels: {
            '1D': 'Last 24 hours',
            '1W': 'Last 7 days',
            '1M': 'Last 30 days',
            '3M': 'Last 3 months',
            '6M': 'Last 6 months',
            '1Y': 'Last 12 months',
            '2Y': 'Last 2 years',
            '5Y': 'Last 5 years',
            'YTD': 'Year to date'
        }
    },
    pt: {
        currentBitcoinPrice: 'Preço atual do Bitcoin',
        refreshPrice: 'atualizar preço',
        help: 'ajuda',
        footerInfo: 'Clique ou toque no display BTC/SATS ou de moedas fiat para inserir o valores.',
        howToUse: 'Como usar:',
        instruction1: 'Use os botões EN/PT para selecionar o idioma: Inglês ou Português',
        instruction2: 'Use os botões BRL/SATS ou USD BRL EUR GBP para selecionar a unidade',
        instruction3: 'Clique ou toque no display BTC/SATS ou no display de moedas fiduciárias para inserir o valor e pressione OK para atualizar o painel',
        instruction4: 'Clique ou toque no botão Atualizar Preço para atualizar o preço atual do Bitcoin',
        instruction5: 'Clique ou toque no valor % de retorno para selecionar um período diferente',
        instruction6: '<a href="https://21bitcoin.info" target="_blank">Aprenda Bitcoin</a>',
        infoModalText0: 'Você pode comprar pequenos pedaços de Bitcoin!',
        infoModalText1: 'Um Satoshi – também conhecido como "SAT" – é uma fração bem pequena de Bitcoin. Ele é igual a 0.00000001 Bitcoin.',
        infoModalText2: 'Assim como 1 Real pode ser dividido em 100 centavos, 1 Bitcoin pode ser dividido em 100 milhões de satoshis.',
        infoModalText3: 'Isto significa que:<br>1 Bitcoin = 100 milhões de SATS.',
        periodDisplayCodes: {
            '1D': '1D',
            '1W': '1S', // 'S' for "semana" (week)
            '1M': '1M',
            '3M': '3M',
            '6M': '6M',
            '1Y': '1A', // 'A' for "ano" (year)
            '2Y': '2A',
            '5Y': '5A',
            'YTD': 'YTD' // Short for "Ano Até Data" (Year to Date)
        },
        periodLabels: {
            '1D': 'Últimas 24 horas',
            '1W': 'Últimos 7 dias',
            '1M': 'Últimos 30 dias',
            '3M': 'Últimos 3 meses',
            '6M': 'Últimos 6 meses',
            '1Y': 'Últimos 12 meses',
            '2Y': 'Últimos 2 anos',
            '5Y': 'Últimos 5 anos',
            'YTD': 'Acumulado no ano'
        }
    }
};/**
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
})();/**
 * mybtc-api.js
 * API functionality for myBTC Calculator
 * Contains functions for API communication and data fetching
 */

// Create namespace
window.MYBTC = window.MYBTC || {};

// API module
window.MYBTC.API = (function () {
    // Get access to Core module
    const Core = window.MYBTC.Core;

    // ==============================================
    // PRIVATE VARIABLES
    // ==============================================

    // API endpoints
    const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

    // ==============================================
    // PRIVATE FUNCTIONS
    // ==============================================

    /**
     * Fetch current price for a trading pair from Binance
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
     * @returns {Promise<number|null>} Current price or null if error
     */
    async function fetchPrice(symbol) {
        try {
            const response = await fetch(`${BINANCE_API_BASE_URL}/ticker/price?symbol=${symbol}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return parseFloat(data.price);
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Get the earliest available Bitcoin price from Binance
     * @returns {Promise<{price: number, timestamp: number}|null>} Earliest price data or null if error
     */
    async function getEarliestBitcoinPrice() {
        try {
            const response = await fetch(`${BINANCE_API_BASE_URL}/klines?symbol=BTCUSDT&interval=1d&startTime=0&limit=1`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return data.length > 0 ? {
                price: parseFloat(data[0][4]),
                timestamp: data[0][0]
            } : null;
        } catch (error) {
            console.error('Error fetching earliest price:', error);
            return null;
        }
    }

    /**
     * Fetch historical Bitcoin price for a specific period
     * @param {string} period - Time period code (e.g., '1D', '1M', '1Y')
     * @returns {Promise<number|null>} Historical price or null if error
     */
    async function fetchHistoricalBitcoinPrice(period) {
        // Calculate the timestamp for the start of the period
        const now = new Date();
        let pastTimestamp;

        if (period === 'YTD') {
            // Year to date: from January 1st of current year
            pastTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
        } else {
            // Other periods: calculate based on days ago
            pastTimestamp = now.getTime() - Core.periodToDaysAgo[period] * 86400000;
        }

        // Check if we need earliest data and don't have it yet
        if (!Core.earliestTimestamp) {
            const earliestData = await getEarliestBitcoinPrice();
            if (earliestData) {
                Core.earliestPrice = earliestData.price;
                Core.earliestTimestamp = earliestData.timestamp;
            }
        }

        // If requested time is before earliest available data, return earliest price
        if (Core.earliestTimestamp && pastTimestamp < Core.earliestTimestamp) {
            return Core.earliestPrice;
        }

        // Use appropriate interval based on the period
        const interval = ['1D', '1W', '1M'].includes(period) ? '1h' : '1d';

        try {
            const response = await fetch(
                `${BINANCE_API_BASE_URL}/klines?symbol=BTCUSDT&interval=${interval}&endTime=${pastTimestamp}&limit=1`
            );

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return data.length > 0 ? parseFloat(data[0][4]) : null;
        } catch (error) {
            console.error(`Error fetching historical price for ${period}:`, error);
            return null;
        }
    }

    /**
     * Fetch all required price data (current and historical) for all supported currencies
     * @returns {Promise<Object>} Object containing all price data
     */
    async function fetchData() {
        try {
            // Step 1: Get BTC price in USD and historical price
            const [btcUsdt, historicalPrice] = await Promise.all([
                fetchPrice('BTCUSDT'),
                fetchHistoricalBitcoinPrice(Core.selectedPeriod)
            ]);

            if (!btcUsdt) {
                throw new Error('Failed to fetch BTC USD price');
            }

            // Step 2: Get conversion rates - using available Binance pairs
            const [usdtBrl, eurUsdt, gbpUsdt] = await Promise.all([
                fetchPrice('USDTBRL'),    // USDT to BRL
                fetchPrice('EURUSDT'),    // EUR to USDT (reverse of what we need)
                fetchPrice('GBPUSDT')     // GBP to USDT (reverse of what we need)
            ]);

            // Step 3: Calculate BTC prices in all currencies
            const prices = {};

            // USD (base currency)
            prices.USD = btcUsdt;

            // BRL (direct conversion rate available)
            prices.BRL = btcUsdt && usdtBrl ? btcUsdt * usdtBrl : null;

            // EUR (we have EURUSDT, so we need to invert: 1/EURUSDT gives us USDTEUR rate)
            prices.EUR = btcUsdt && eurUsdt ? btcUsdt / eurUsdt : null;

            // GBP (we have GBPUSDT, so we need to invert: 1/GBPUSDT gives us USDTGBP rate)
            prices.GBP = btcUsdt && gbpUsdt ? btcUsdt / gbpUsdt : null;

            // Calculate price change percentage (based on USD price)
            const priceChangePercent = btcUsdt && historicalPrice
                ? ((btcUsdt - historicalPrice) / historicalPrice) * 100
                : null;

            // Update Core module with all prices
            Core.currentPriceUSD = prices.USD;
            Core.currentPriceBRL = prices.BRL;
            Core.currentPriceEUR = prices.EUR;
            Core.currentPriceGBP = prices.GBP;
            Core.currentPriceChangePercent = priceChangePercent;

            // Return all data for backward compatibility
            return {
                currentPriceUSD: prices.USD,
                currentPriceBRL: prices.BRL,
                currentPriceEUR: prices.EUR,
                currentPriceGBP: prices.GBP,
                currentPriceChangePercent: priceChangePercent,
                allPrices: prices
            };

        } catch (error) {
            console.error('Error fetching price data:', error);

            // Return null values on error
            return {
                currentPriceUSD: null,
                currentPriceBRL: null,
                currentPriceEUR: null,
                currentPriceGBP: null,
                currentPriceChangePercent: null,
                allPrices: {}
            };
        }
    }

    // ==============================================
    // PUBLIC API
    // ==============================================
    return {
        fetchPrice,
        getEarliestBitcoinPrice,
        fetchHistoricalBitcoinPrice,
        fetchData
    };
})();