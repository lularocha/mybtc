/**
 * mybtc-api.js
 * API functionality for myBTC Calculator
 * Contains functions for API communication and data fetching
 */

// Create namespace
window.MYBTC = window.MYBTC || {};

// API module
window.MYBTC.API = (function() {
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
     * Fetch all required price data (current and historical)
     * @returns {Promise<{currentPriceUSD: number, currentPriceBRL: number, currentPriceChangePercent: number}>}
     */
    async function fetchData() {
        // Fetch multiple pieces of data in parallel for efficiency
        const [btcUsdt, usdtBrl, historicalPrice] = await Promise.all([
            fetchPrice('BTCUSDT'),
            fetchPrice('USDTBRL'),
            fetchHistoricalBitcoinPrice(Core.selectedPeriod)
        ]);
        
        // Calculate values
        const newCurrentPriceUSD = btcUsdt;
        const newCurrentPriceBRL = btcUsdt !== null && usdtBrl !== null ? btcUsdt * usdtBrl : null;
        const newCurrentPriceChangePercent = newCurrentPriceUSD && historicalPrice 
            ? ((newCurrentPriceUSD - historicalPrice) / historicalPrice) * 100 
            : null;
        
        // Return all values
        return { 
            currentPriceUSD: newCurrentPriceUSD, 
            currentPriceBRL: newCurrentPriceBRL, 
            currentPriceChangePercent: newCurrentPriceChangePercent 
        };
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