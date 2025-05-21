function formatNumberWithCommas(value, unit) {
    // Store the raw value without formatting
    let rawValue = value;
    
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
}// Initialize currentLang at the top
let currentLang = 'en';

let earliestPrice = null;
let earliestTimestamp = null;

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

let selectedPeriod = '1Y';
let currentPriceUSD = null;
let currentPriceBRL = null;
let currentPriceChangePercent = null;
let currentAmount = null;
let btcUnit = 'BTC';
let fiatUnit = 'USD';

// Keypad variables
let activeField = 'btc';
let tempValue = '0'; // Stores input during editing
let previousValue = '0'; // Stores value before editing
let modal = null;

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
const formatSats = (number) => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function countDigits(text) {
    return text.replace(/[^0-9]/g, '').length;
}

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

async function fetchPrice(symbol) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null;
    }
}

async function getEarliestBitcoinPrice() {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=0&limit=1`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.length > 0 ? { price: parseFloat(data[0][4]), timestamp: data[0][0] } : null;
    } catch (error) {
        console.error('Error fetching earliest price:', error);
        return null;
    }
}

async function fetchHistoricalBitcoinPrice(period) {
    const now = new Date();
    let pastTimestamp = period === 'YTD' ? new Date(now.getFullYear(), 0, 1).getTime() : now.getTime() - periodToDaysAgo[period] * 86400000;
    if (!earliestTimestamp) {
        const earliestData = await getEarliestBitcoinPrice();
        if (earliestData) {
            earliestPrice = earliestData.price;
            earliestTimestamp = earliestData.timestamp;
        }
    }
    if (earliestTimestamp && pastTimestamp < earliestTimestamp) return earliestPrice;
    const interval = ['1D', '1W', '1M'].includes(period) ? '1h' : '1d';
    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&endTime=${pastTimestamp}&limit=1`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.length > 0 ? parseFloat(data[0][4]) : null;
    } catch (error) {
        console.error(`Error fetching historical price for ${period}:`, error);
        return null;
    }
}

async function fetchData() {
    const [btcUsdt, usdtBrl, historicalPrice] = await Promise.all([
        fetchPrice('BTCUSDT'),
        fetchPrice('USDTBRL'),
        fetchHistoricalBitcoinPrice(selectedPeriod)
    ]);
    currentPriceUSD = btcUsdt;
    currentPriceBRL = btcUsdt !== null && usdtBrl !== null ? btcUsdt * usdtBrl : null;
    currentPriceChangePercent = currentPriceUSD && historicalPrice ? ((currentPriceUSD - historicalPrice) / historicalPrice) * 100 : null;
    return { currentPriceUSD, currentPriceBRL, currentPriceChangePercent };
}

function updateDisplay() {
    const periodLabel = translations[currentLang].periodLabels[selectedPeriod];
    document.getElementById('current-BTC-change-label').textContent = periodLabel;
    const price = fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL;
    const symbol = fiatUnit === 'USD' ? '$' : 'R$';

    const priceElement = document.getElementById('current-BTC-price-display');
    priceElement.querySelector('.USDBRL-symbol').textContent = symbol;
    const priceAmountSpan = priceElement.querySelector('.current-BTC-price-amount');
    priceAmountSpan.textContent = price !== null ? fiatFormatter.format(price) : 'Error fetching price';

    const btcDisplaySpan = document.querySelector('#BTC-amount-display .BTC-amount');
    let displayAmount;
    if (currentAmount !== null) {
        displayAmount = btcUnit === 'BTC' ? btcFormatter.format(currentAmount) : formatSats(Math.round(currentAmount * 100000000));
    } else {
        displayAmount = btcUnit === 'BTC' ? btcFormatter.format(0) : '000,000,000';
    }
    btcDisplaySpan.textContent = displayAmount;

    const fiatSymbolSpan = document.querySelector('#USDBRL-amount-display .USDBRL-symbol');
    fiatSymbolSpan.textContent = symbol;
    const fiatAmountSpan = document.querySelector('#USDBRL-amount-display .USDBRL-amount');
    fiatAmountSpan.textContent = price && currentAmount ? fiatFormatter.format(currentAmount * price) : '0.00';

    const changeDisplay = document.getElementById('current-BTC-change-display');
    const arrowSpan = changeDisplay.querySelector('.arrow-symbol');
    const percentSpan = changeDisplay.querySelector('.current-BTC-change-amount');
    if (currentPriceChangePercent !== null) {
        const arrow = currentPriceChangePercent >= 0 ? '↑' : '↓';
        const absPercent = Math.abs(currentPriceChangePercent).toFixed(1);
        arrowSpan.textContent = arrow;
        percentSpan.textContent = `${absPercent}%`;
        changeDisplay.style.color = currentPriceChangePercent >= 0 ? '#090' : '#f00';
    } else {
        arrowSpan.textContent = '';
        percentSpan.textContent = 'N/A';
        changeDisplay.style.color = '#000';
    }

    const btcText = btcDisplaySpan.textContent;
    btcDisplaySpan.style.fontSize = `${getFontSizeBtcSats(countDigits(btcText))}px`;

    const fiatText = fiatAmountSpan.textContent;
    const fontSize = getFontSizeUsdBrl(countDigits(fiatText));
    fiatAmountSpan.style.fontSize = `${fontSize}px`;
    fiatSymbolSpan.style.fontSize = `${fontSize}px`;
}

function updateUnitButtons() {
    document.querySelector('.btc-btn').classList.toggle('active', btcUnit === 'BTC');
    document.querySelector('.sats-btn').classList.toggle('active', btcUnit === 'SATS');
    document.querySelector('.usd-btn').classList.toggle('active', fiatUnit === 'USD');
    document.querySelector('.brl-btn').classList.toggle('active', fiatUnit === 'BRL');
}

// Function to update the equivalent value in real-time
function updateEquivalentValue() {
    // Skip if no prices are available
    if (!currentPriceUSD || (fiatUnit === 'BRL' && !currentPriceBRL)) {
        return;
    }
    
    // Get the current value without commas
    const currentValue = tempValue.replace(/,/g, '');
    
    if (activeField === 'btc') {
        // Calculate fiat equivalent
        let btcAmount;
        if (btcUnit === 'BTC') {
            btcAmount = parseFloat(currentValue) || 0;
        } else { // SATS
            btcAmount = (parseInt(currentValue, 10) || 0) / 100000000;
        }
        
        // Calculate fiat value
        const price = fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL;
        const fiatValue = btcAmount * price;
        
        // Update fiat display
        const fiatDisplaySpan = document.querySelector('#USDBRL-amount-display .USDBRL-amount');
        fiatDisplaySpan.textContent = fiatFormatter.format(fiatValue);
        
        // Update font size of the fiat display
        const fontSize = getFontSizeUsdBrl(countDigits(fiatDisplaySpan.textContent));
        fiatDisplaySpan.style.fontSize = `${fontSize}px`;
        document.querySelector('#USDBRL-amount-display .USDBRL-symbol').style.fontSize = `${fontSize}px`;
    } else { // fiat is active
        // Calculate BTC equivalent
        const fiatValue = parseFloat(currentValue) || 0;
        const price = fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL;
        const btcValue = fiatValue / price;
        
        // Update BTC display
        const btcDisplaySpan = document.querySelector('#BTC-amount-display .BTC-amount');
        if (btcUnit === 'BTC') {
            btcDisplaySpan.textContent = btcFormatter.format(btcValue);
        } else { // SATS
            btcDisplaySpan.textContent = formatSats(Math.round(btcValue * 100000000));
        }
        
        // Update font size of the BTC display
        const fontSize = getFontSizeBtcSats(countDigits(btcDisplaySpan.textContent));
        btcDisplaySpan.style.fontSize = `${fontSize}px`;
    }
}

// Keypad functions
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
        if (currentAmount !== null) {
            if (btcUnit === 'BTC') {
                tempValue = currentAmount.toFixed(8);
                // Remove trailing zeros after decimal point
                tempValue = tempValue.replace(/\.?0+$/, '');
                if (tempValue === '') tempValue = '0';
            } else {
                tempValue = Math.round(currentAmount * 100000000).toString();
                if (tempValue === '') tempValue = '0';
            }
        } else {
            tempValue = '0';
        }
        
        // Format the value with commas
        const formattedValue = formatNumberWithCommas(tempValue, btcUnit);
        btcInput.value = formattedValue;
        updateInputFontSize(btcInput, btcUnit);
    } else { // fiat
        // Show fiat input field
        fiatDisplay.style.display = 'none';
        fiatInput.style.display = 'block';
        
        // Set the initial value
        if (currentAmount !== null && (fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL)) {
            tempValue = ((fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL) * currentAmount).toFixed(2);
            // Remove trailing zeros after decimal point for display only
            tempValue = tempValue.replace(/\.?0+$/, '');
            if (tempValue === '') tempValue = '0';
        } else {
            tempValue = '0';
        }
        
        // Format the value with commas
        const formattedValue = formatNumberWithCommas(tempValue, fiatUnit);
        fiatInput.value = formattedValue;
        updateInputFontSize(fiatInput, fiatUnit);
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
        if (btcUnit === 'BTC') {
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
        const formattedValue = formatNumberWithCommas(currentValue, btcUnit);
        
        // Update the BTC input field with formatted value
        const btcInput = document.querySelector('.BTC-input');
        btcInput.value = formattedValue;
        updateInputFontSize(btcInput, btcUnit);
    } else {
        // For fiat, limit to 2 decimal places
        let parts = currentValue.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
            currentValue = parts.join('.');
        }
        
        // Format the value with commas
        tempValue = currentValue;
        const formattedValue = formatNumberWithCommas(currentValue, fiatUnit);
        
        // Update the fiat input field with formatted value
        const fiatInput = document.querySelector('.fiat-input');
        fiatInput.value = formattedValue;
        updateInputFontSize(fiatInput, fiatUnit);
    }
    
    // Update the equivalent value
    updateEquivalentValue();
}

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
        const formattedValue = formatNumberWithCommas(currentValue, btcUnit);
        const btcInput = document.querySelector('.BTC-input');
        btcInput.value = formattedValue;
        updateInputFontSize(btcInput, btcUnit);
    } else {
        const formattedValue = formatNumberWithCommas(currentValue, fiatUnit);
        const fiatInput = document.querySelector('.fiat-input');
        fiatInput.value = formattedValue;
        updateInputFontSize(fiatInput, fiatUnit);
    }
    
    // Update the equivalent value
    updateEquivalentValue();
}

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

function submitInput() {
    if (activeField === 'btc') {
        if (btcUnit === 'BTC') {
            currentAmount = parseFloat(tempValue) || 0;
        } else { // SATS
            currentAmount = (parseInt(tempValue, 10) || 0) / 100000000;
        }
    } else { // Fiat
        const price = fiatUnit === 'USD' ? currentPriceUSD : currentPriceBRL;
        if (price) {
            currentAmount = (parseFloat(tempValue) || 0) / price;
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

function processBtcInput() {
    let value = btcInput.value.trim();
    if (value === '') {
        currentAmount = null;
    } else {
        if (btcUnit === 'BTC') {
            value = value.replace(/,/g, '');
            value = parseFloat(value);
            currentAmount = !isNaN(value) && value >= 0 ? value : null;
        } else if (btcUnit === 'SATS') {
            value = value.replace(/,/g, '');
            value = parseInt(value, 10);
            currentAmount = !isNaN(value) && value >= 0 ? value / 100000000 : null;
        }
    }
    updateDisplay();
}

function processFiatInput() {
    let value = fiatInput.value.trim().replace(/,/g, '');
    if (value === '') {
        currentAmount = null;
    } else {
        value = parseFloat(value);
        if (!isNaN(value) && value >= 0) {
            if (fiatUnit === 'USD' && currentPriceUSD) {
                currentAmount = value / currentPriceUSD;
            } else if (fiatUnit === 'BRL' && currentPriceBRL) {
                currentAmount = value / currentPriceBRL;
            } else {
                currentAmount = null;
            }
        } else {
            currentAmount = null;
        }
    }
    updateDisplay();
}

function updateInputFontSize(inputElement, unit) {
    let text = inputElement.value;
    if (unit === 'BTC' || unit === 'SATS') {
        inputElement.style.fontSize = `${getFontSizeBtcSats(countDigits(text))}px`;
    } else if (unit === 'USD' || unit === 'BRL') {
        inputElement.style.fontSize = `${getFontSizeUsdBrl(countDigits(text))}px`;
    }
}

async function init() {
    // Initialize modal reference
    modal = document.getElementById('keypadModal');
    
    // Get initial price data
    const data = await fetchData();
    currentPriceUSD = data.currentPriceUSD;
    currentPriceBRL = data.currentPriceBRL;
    currentPriceChangePercent = data.currentPriceChangePercent;
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
}

const btcBtn = document.querySelector('.btc-btn');
const satsBtn = document.querySelector('.sats-btn');
const usdBtn = document.querySelector('.usd-btn');
const brlBtn = document.querySelector('.brl-btn');
const btcDisplay = document.getElementById('BTC-amount-display');
const btcInput = document.querySelector('.BTC-input');
const fiatDisplay = document.getElementById('USDBRL-amount-display');
const fiatInput = document.querySelector('.fiat-input');

btcBtn.addEventListener('click', () => { btcUnit = 'BTC'; updateUnitButtons(); updateDisplay(); });
satsBtn.addEventListener('click', () => { btcUnit = 'SATS'; updateUnitButtons(); updateDisplay(); });
usdBtn.addEventListener('click', () => { fiatUnit = 'USD'; updateUnitButtons(); updateDisplay(); });
brlBtn.addEventListener('click', () => { fiatUnit = 'BRL'; updateUnitButtons(); updateDisplay(); });

// Display click handlers - modified to use the keypad modal
btcDisplay.addEventListener('click', () => {
    openModal('btc');
});

fiatDisplay.addEventListener('click', () => {
    openModal('fiat');
});

// We'll keep these for backwards compatibility, but won't be using them with the keypad
btcInput.addEventListener('blur', () => { processBtcInput(); btcInput.style.display = 'none'; btcDisplay.style.display = 'flex'; });
btcInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { processBtcInput(); btcInput.style.display = 'none'; btcDisplay.style.display = 'flex'; } });
fiatInput.addEventListener('blur', () => { processFiatInput(); fiatInput.style.display = 'none'; fiatDisplay.style.display = 'flex'; });
fiatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { processFiatInput(); fiatInput.style.display = 'none'; fiatDisplay.style.display = 'flex'; } });

document.getElementById('refresh').addEventListener('click', async () => {
    const data = await fetchData();
    currentPriceUSD = data.currentPriceUSD;
    currentPriceBRL = data.currentPriceBRL;
    currentPriceChangePercent = data.currentPriceChangePercent;
    updateDisplay();
});

document.querySelector('.mybtclogo').addEventListener('click', async () => {
    window.spinLogo();
    const data = await fetchData();
    currentPriceUSD = data.currentPriceUSD;
    currentPriceBRL = data.currentPriceBRL;
    currentPriceChangePercent = data.currentPriceChangePercent;
    updateDisplay();
});

const periodMenu = document.getElementById('period-menu');
periodCodes.forEach(code => {
    const button = document.createElement('button');
    button.textContent = translations[currentLang].periodDisplayCodes[code];
    button.setAttribute('data-period', code);
    button.addEventListener('click', () => {
        selectedPeriod = code;
        document.getElementById('current-BTC-change-label').textContent = translations[currentLang].periodLabels[code];
        periodMenu.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn.getAttribute('data-period') === selectedPeriod));
        fetchHistoricalBitcoinPrice(selectedPeriod).then(historicalPrice => {
            currentPriceChangePercent = currentPriceUSD && historicalPrice ? ((currentPriceUSD - historicalPrice) / historicalPrice) * 100 : null;
            updateDisplay();
        });
        periodMenu.classList.remove('active');
    });
    periodMenu.appendChild(button);
});

document.querySelector(`#period-menu button[data-period="1Y"]`).classList.add('selected');
const changeDisplay = document.getElementById('current-BTC-change-display');
changeDisplay.setAttribute('role', 'button');
changeDisplay.setAttribute('tabindex', '0');
changeDisplay.addEventListener('click', () => periodMenu.classList.toggle('active'));
changeDisplay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); periodMenu.classList.toggle('active'); } });
document.addEventListener('click', (e) => { if (!changeDisplay.contains(e.target) && !periodMenu.contains(e.target)) periodMenu.classList.remove('active'); });
window.addEventListener('resize', updateDisplay);

// Language switching
const langButtons = document.querySelectorAll('.lang-btn');
langButtons.forEach(button => {
    button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        setLanguage(lang);
    });
});

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.innerHTML = translations[lang][key];
    });
    langButtons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-lang') === lang);
    });
    // Update period menu buttons and current label
    periodMenu.querySelectorAll('button').forEach(button => {
        const code = button.getAttribute('data-period');
        button.textContent = translations[lang].periodDisplayCodes[code];
    });
    if (selectedPeriod) {
        document.getElementById('current-BTC-change-label').textContent = translations[lang].periodLabels[selectedPeriod];
    }
}

// Initialize with English
setLanguage('en');

// Initialize the app
init();

// Update the equivalent value
updateEquivalentValue();