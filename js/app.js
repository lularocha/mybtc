/**
 * app.js
 * Combined UI and utility functionality for myBTC Calculator
 */

// Fix for preventing zooming on Android
document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// ==============================================
// LOGO ANIMATION (from btclogo-animation.js)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.mybtclogo');
    const refreshButton = document.getElementById('refresh');

    // Function to trigger the spin animation
    window.spinLogo = function () {
        if (!logo) return;
        logo.classList.remove('spin');
        requestAnimationFrame(() => {
            logo.classList.add('spin');
        });
    };

    // Add event listener to the refresh button
    if (refreshButton) {
        refreshButton.addEventListener('click', window.spinLogo);
    }
});

// ==============================================
// INFO PANEL & MODAL (from info.js)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    // Info Panel Logic
    const infoButton = document.getElementById('info');
    const infoPanel = document.getElementById('info-panel');
    const closeInfoPanel = document.getElementById('close-info-panel');

    if (infoButton && infoPanel) {
        infoButton.setAttribute('aria-expanded', 'false');
        infoButton.setAttribute('aria-controls', 'info-panel');

        const openPanel = () => {
            infoPanel.classList.add('open');
            infoButton.setAttribute('aria-expanded', 'true');
        };

        const closePanel = () => {
            infoPanel.classList.remove('open');
            infoButton.setAttribute('aria-expanded', 'false');
        };

        infoButton.addEventListener('click', openPanel);
        if (closeInfoPanel) closeInfoPanel.addEventListener('click', closePanel);

        window.addEventListener('click', (event) => {
            if (!infoPanel.contains(event.target) && event.target !== infoButton) {
                closePanel();
            }
        });
    }

    // Info Modal Logic
    const infoIcon = document.querySelector('.info-icon');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-info-modal');

    if (infoIcon && infoModal) {
        infoIcon.setAttribute('aria-expanded', 'false');
        infoIcon.setAttribute('aria-controls', 'info-modal');
        infoIcon.setAttribute('tabindex', '0');

        const openModal = () => {
            infoModal.style.display = 'block';
            setTimeout(() => infoModal.classList.add('is-visible'), 10);
            infoIcon.setAttribute('aria-expanded', 'true');
        };

        const closeModal = () => {
            infoModal.classList.remove('is-visible');
            setTimeout(() => {
                if (!infoModal.classList.contains('is-visible')) {
                    infoModal.style.display = 'none';
                }
            }, 300);
            infoIcon.setAttribute('aria-expanded', 'false');
        };

        infoIcon.addEventListener('mouseover', openModal);
        infoIcon.addEventListener('mouseout', closeModal);
        infoIcon.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
        infoIcon.addEventListener('touchstart', (e) => { e.preventDefault(); openModal(); });
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

        document.addEventListener('click', (e) => {
            if (!infoModal.contains(e.target) && e.target !== infoIcon) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoModal.classList.contains('is-visible')) {
                closeModal();
            }
        });
    }
});

// ==============================================
// DARK MODE LOGIC (from dark-mode.js)
// ==============================================
function toggleDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
    }
}

function setupDarkModeToggle() {
    const darkModeIconContainer = document.querySelector('.dark-mode-icon');
    if (!darkModeIconContainer) return;

    const createMaterialIcon = (iconName) => {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined';
        iconSpan.textContent = iconName;
        return iconSpan;
    };

    const updateIcon = (isDark) => {
        darkModeIconContainer.innerHTML = '';
        darkModeIconContainer.appendChild(createMaterialIcon(isDark ? 'light_mode' : 'dark_mode'));
    };

    darkModeIconContainer.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        toggleDarkMode(!isDarkMode);
        updateIcon(!isDarkMode);
        localStorage.setItem('darkMode', !isDarkMode);
    });

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        toggleDarkMode(true);
        updateIcon(true);
    } else {
        updateIcon(false);
    }
}

document.addEventListener('DOMContentLoaded', setupDarkModeToggle);

// ==============================================
// ANDROID KEYPAD FALLBACK (from android-keypad-fallback.js)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return;

    function showNativeBtcInput() {
        const btcDisplay = document.getElementById('BTC-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        if (!btcDisplay || !btcInput) return;

        btcDisplay.style.display = 'none';
        btcInput.style.display = 'block';
        btcInput.focus();
    }

    function showNativeFiatInput() {
        const fiatDisplay = document.getElementById('fiat-amount-display');
        const fiatInput = document.querySelector('.fiat-input');
        if (!fiatDisplay || !fiatInput) return;

        fiatDisplay.style.display = 'none';
        fiatInput.style.display = 'block';
        fiatInput.focus();
    }

    const btcDisplay = document.getElementById('BTC-amount-display');
    const fiatDisplay = document.getElementById('fiat-amount-display');

    if (btcDisplay) btcDisplay.addEventListener('click', (e) => {
        if (isAndroid) { e.stopImmediatePropagation(); showNativeBtcInput(); }
    });

    if (fiatDisplay) fiatDisplay.addEventListener('click', (e) => {
        if (isAndroid) { e.stopImmediatePropagation(); showNativeFiatInput(); }
    });
});

// ==============================================
// UI CORE LOGIC (from mybtc-ui.js)
// ==============================================
window.MYBTC.UI = (function () {
    const Core = window.MYBTC.Core;
    const API = window.MYBTC.API;

    let activeField = 'btc';
    let tempValue = '0';
    let previousValue = '0';
    let modal = null;

    function updateDisplay() {
        const periodLabel = translations[Core.currentLang].periodLabels[Core.selectedPeriod];
        document.getElementById('current-BTC-change-label').textContent = periodLabel;

        const price = Core.getCurrentPrice(Core.fiatUnit);
        const symbol = Core.supportedCurrencies[Core.fiatUnit].symbol;

        const priceElement = document.getElementById('current-BTC-price-display');
        priceElement.querySelector('.fiat-symbol').textContent = symbol;
        const priceAmountSpan = priceElement.querySelector('.current-BTC-price-amount');
        priceAmountSpan.textContent = price !== null ? Core.fiatFormatter.format(price) : 'Error fetching price';

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

        const fiatSymbolSpan = document.querySelector('#fiat-amount-display .fiat-symbol');
        fiatSymbolSpan.textContent = symbol;
        const fiatAmountSpan = document.querySelector('#fiat-amount-display .fiat-amount');
        fiatAmountSpan.textContent = price && Core.currentAmount ? Core.fiatFormatter.format(Core.currentAmount * price) : '0.00';

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

        const btcText = btcDisplaySpan.textContent;
        btcDisplaySpan.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(btcText))}px`;

        const fiatText = fiatAmountSpan.textContent;
        const fontSize = Core.getFontSizeUsdBrl(Core.countDigits(fiatText));
        fiatAmountSpan.style.fontSize = `${fontSize}px`;
        fiatSymbolSpan.style.fontSize = `${fontSize}px`;
    }

    function updateUnitButtons() {
        document.querySelector('.btc-btn').classList.toggle('active', Core.btcUnit === 'BTC');
        document.querySelector('.sats-btn').classList.toggle('active', Core.btcUnit === 'SATS');
        Object.keys(Core.supportedCurrencies).forEach(currency => {
            const button = document.querySelector(`.${currency.toLowerCase()}-btn`);
            if (button) button.classList.toggle('active', Core.fiatUnit === currency);
        });
    }

    function updateEquivalentValue() {
        const currentPrice = Core.getCurrentPrice(Core.fiatUnit);
        if (!currentPrice) return;
        const currentValue = tempValue.replace(/,/g, '');

        if (activeField === 'btc') {
            let btcAmount = Core.btcUnit === 'BTC' ? parseFloat(currentValue) || 0 : (parseInt(currentValue, 10) || 0) / 100000000;
            const fiatValue = btcAmount * currentPrice;
            const fiatDisplaySpan = document.querySelector('#fiat-amount-display .fiat-amount');
            fiatDisplaySpan.textContent = Core.fiatFormatter.format(fiatValue);
            const fontSize = Core.getFontSizeUsdBrl(Core.countDigits(fiatDisplaySpan.textContent));
            fiatDisplaySpan.style.fontSize = `${fontSize}px`;
            document.querySelector('#fiat-amount-display .fiat-symbol').style.fontSize = `${fontSize}px`;
        } else {
            const fiatValue = parseFloat(currentValue) || 0;
            const btcValue = fiatValue / currentPrice;
            const btcDisplaySpan = document.querySelector('#BTC-amount-display .BTC-amount');
            btcDisplaySpan.textContent = Core.btcUnit === 'BTC' ? Core.btcFormatter.format(btcValue) : Core.formatSats(Math.round(btcValue * 100000000));
            btcDisplaySpan.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(btcDisplaySpan.textContent))}px`;
        }
    }

    function updateInputFontSize(inputElement, unit) {
        let text = inputElement.value;
        if (unit === 'BTC' || unit === 'SATS') {
            inputElement.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(text))}px`;
        } else if (Object.keys(Core.supportedCurrencies).includes(unit)) {
            inputElement.style.fontSize = `${Core.getFontSizeUsdBrl(Core.countDigits(text))}px`;
        }
    }

    function openModal(field) {
        activeField = field;
        const btcDisplay = document.getElementById('BTC-amount-display');
        const fiatDisplay = document.getElementById('fiat-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        const fiatInput = document.querySelector('.fiat-input');
        document.querySelector('.main-container').classList.add('slide-up');

        if (field === 'btc') {
            btcDisplay.style.display = 'none';
            btcInput.style.display = 'block';
            if (Core.currentAmount !== null) {
                tempValue = Core.btcUnit === 'BTC' ? Core.currentAmount.toFixed(8).replace(/\.?0+$/, '') : Math.round(Core.currentAmount * 100000000).toString();
                if (tempValue === '') tempValue = '0';
            } else tempValue = '0';
            btcInput.value = Core.formatNumberWithCommas(tempValue, Core.btcUnit);
            updateInputFontSize(btcInput, Core.btcUnit);
        } else {
            fiatDisplay.style.display = 'none';
            fiatInput.style.display = 'block';
            const price = Core.getCurrentPrice(Core.fiatUnit);
            if (Core.currentAmount !== null && price) {
                tempValue = (price * Core.currentAmount).toFixed(2).replace(/\.?0+$/, '');
                if (tempValue === '') tempValue = '0';
            } else tempValue = '0';
            fiatInput.value = Core.formatNumberWithCommas(tempValue, Core.fiatUnit);
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        previousValue = tempValue;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('open'), 10);
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.querySelector('.main-container').classList.remove('slide-up');
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    function appendToDisplay(value) {
        let currentValue = tempValue.replace(/,/g, '');
        if (currentValue === '0' && value !== '.') currentValue = value;
        else if (value === '.' && currentValue.includes('.')) return;
        else currentValue += value;

        if (activeField === 'btc') {
            if (Core.btcUnit === 'BTC') {
                let parts = currentValue.split('.');
                if (parts.length > 1 && parts[1].length > 8) parts[1] = parts[1].substring(0, 8);
                currentValue = parts.join('.');
            } else currentValue = currentValue.replace(/\D/g, '');
            tempValue = currentValue;
            const btcInput = document.querySelector('.BTC-input');
            btcInput.value = Core.formatNumberWithCommas(currentValue, Core.btcUnit);
            updateInputFontSize(btcInput, Core.btcUnit);
        } else {
            let parts = currentValue.split('.');
            if (parts.length > 1 && parts[1].length > 2) parts[1] = parts[1].substring(0, 2);
            currentValue = parts.join('.');
            tempValue = currentValue;
            const fiatInput = document.querySelector('.fiat-input');
            fiatInput.value = Core.formatNumberWithCommas(currentValue, Core.fiatUnit);
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        updateEquivalentValue();
    }

    function deleteLast() {
        let currentValue = tempValue.replace(/,/g, '').slice(0, -1);
        if (currentValue === '') currentValue = '0';
        tempValue = currentValue;
        if (activeField === 'btc') {
            const btcInput = document.querySelector('.BTC-input');
            btcInput.value = Core.formatNumberWithCommas(currentValue, Core.btcUnit);
            updateInputFontSize(btcInput, Core.btcUnit);
        } else {
            const fiatInput = document.querySelector('.fiat-input');
            fiatInput.value = Core.formatNumberWithCommas(currentValue, Core.fiatUnit);
            updateInputFontSize(fiatInput, Core.fiatUnit);
        }
        updateEquivalentValue();
    }

    function cancelInput() {
        tempValue = previousValue;
        closeModal();
        const btcDisplay = document.getElementById('BTC-amount-display'), fiatDisplay = document.getElementById('fiat-amount-display');
        const btcInput = document.querySelector('.BTC-input'), fiatInput = document.querySelector('.fiat-input');
        btcInput.style.display = 'none'; fiatInput.style.display = 'none';
        btcDisplay.style.display = 'flex'; fiatDisplay.style.display = 'flex';
    }

    function submitInput() {
        if (activeField === 'btc') {
            Core.currentAmount = Core.btcUnit === 'BTC' ? parseFloat(tempValue) || 0 : (parseInt(tempValue, 10) || 0) / 100000000;
        } else {
            const price = Core.getCurrentPrice(Core.fiatUnit);
            if (price) Core.currentAmount = (parseFloat(tempValue) || 0) / price;
        }
        const btcDisplay = document.getElementById('BTC-amount-display'), fiatDisplay = document.getElementById('fiat-amount-display');
        const btcInput = document.querySelector('.BTC-input'), fiatInput = document.querySelector('.fiat-input');
        btcInput.style.display = 'none'; fiatInput.style.display = 'none';
        btcDisplay.style.display = 'flex'; fiatDisplay.style.display = 'flex';
        closeModal(); updateDisplay();
    }

    function setupPeriodMenu() {
        const periodMenu = document.getElementById('period-menu');
        Core.periodCodes.forEach(code => {
            const button = document.createElement('button');
            button.textContent = translations[Core.currentLang].periodDisplayCodes[code];
            button.setAttribute('data-period', code);
            button.addEventListener('click', () => {
                Core.selectedPeriod = code;
                document.getElementById('current-BTC-change-label').textContent = translations[Core.currentLang].periodLabels[code];
                periodMenu.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn.getAttribute('data-period') === Core.selectedPeriod));
                API.fetchHistoricalBitcoinPrice(Core.selectedPeriod).then(historicalPrice => {
                    Core.currentPriceChangePercent = Core.currentPriceUSD && historicalPrice ? ((Core.currentPriceUSD - historicalPrice) / historicalPrice) * 100 : null;
                    updateDisplay();
                });
                periodMenu.classList.remove('active');
            });
            periodMenu.appendChild(button);
        });
        document.querySelector(`#period-menu button[data-period="1Y"]`)?.classList.add('selected');
        const changeDisplay = document.getElementById('current-BTC-change-display');
        changeDisplay.addEventListener('click', () => periodMenu.classList.toggle('active'));
        document.addEventListener('click', (e) => { if (!changeDisplay.contains(e.target) && !periodMenu.contains(e.target)) periodMenu.classList.remove('active'); });
    }

    function updatePeriodMenuLanguage() {
        const periodMenu = document.getElementById('period-menu');
        periodMenu.querySelectorAll('button').forEach(button => {
            button.textContent = translations[Core.currentLang].periodDisplayCodes[button.getAttribute('data-period')];
        });
        if (Core.selectedPeriod) document.getElementById('current-BTC-change-label').textContent = translations[Core.currentLang].periodLabels[Core.selectedPeriod];
    }

    function setupEventListeners() {
        document.querySelector('.btc-btn').addEventListener('click', () => { Core.btcUnit = 'BTC'; updateUnitButtons(); updateDisplay(); });
        document.querySelector('.sats-btn').addEventListener('click', () => { Core.btcUnit = 'SATS'; updateUnitButtons(); updateDisplay(); });
        Object.keys(Core.supportedCurrencies).forEach(currency => {
            const btn = document.querySelector(`.${currency.toLowerCase()}-btn`);
            if (btn) btn.addEventListener('click', () => { Core.fiatUnit = currency; updateUnitButtons(); updateDisplay(); });
        });
        document.getElementById('BTC-amount-display').addEventListener('click', () => openModal('btc'));
        document.getElementById('fiat-amount-display').addEventListener('click', () => openModal('fiat'));
        document.getElementById('refresh').addEventListener('click', async () => { await API.fetchData(); updateDisplay(); });
        document.querySelector('.mybtclogo').addEventListener('click', async () => { window.spinLogo(); await API.fetchData(); updateDisplay(); });
        setupPeriodMenu();
        document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => { Core.setLanguage(btn.getAttribute('data-lang')); updatePeriodMenuLanguage(); }));
        window.addEventListener('resize', updateDisplay);
    }

    async function init() {
        modal = document.getElementById('keypadModal');
        await API.fetchData();
        updateDisplay();
        updateUnitButtons();
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) cancelInput(); });
        document.querySelectorAll('.keypad button').forEach(button => button.style.touchAction = 'manipulation');
        setupEventListeners();
    }

    return { init, updateDisplay, updateUnitButtons, openModal, closeModal, appendToDisplay, deleteLast, cancelInput, submitInput };
})();

window.openModal = window.MYBTC.UI.openModal;
window.closeModal = window.MYBTC.UI.closeModal;
window.appendToDisplay = window.MYBTC.UI.appendToDisplay;
window.deleteLast = window.MYBTC.UI.deleteLast;
window.cancelInput = window.MYBTC.UI.cancelInput;
window.submitInput = window.MYBTC.UI.submitInput;

document.addEventListener('DOMContentLoaded', () => {
    window.MYBTC.UI.init();
    window.MYBTC.Core.setLanguage('en');
});

// Additional Android compatibility logic (moved from index.html)
if (/Android/i.test(navigator.userAgent)) {
    document.addEventListener('DOMContentLoaded', function () {
        function addTouchHandler(element, handler) {
            if (!element) return;
            element.addEventListener('touchstart', function (e) {
                e.preventDefault();
                setTimeout(function () {
                    handler(e);
                }, 10);
            }, { passive: false });
        }

        // Apply to BTC and fiat displays
        addTouchHandler(document.getElementById('BTC-amount-display'), function () {
            window.openModal('btc');
        });

        addTouchHandler(document.getElementById('fiat-amount-display'), function () {
            window.openModal('fiat');
        });

        // Apply to all keypad buttons using data attributes
        document.querySelectorAll('.keypad button[data-value]').forEach(function (button) {
            addTouchHandler(button, function () {
                window.appendToDisplay(button.getAttribute('data-value'));
            });
        });

        // Special actions
        const deleteBtn = document.querySelector('.keypad button[data-action="delete"]');
        if (deleteBtn) {
            addTouchHandler(deleteBtn, function () {
                window.deleteLast();
            });
        }

        const cancelBtn = document.querySelector('.modal-actions button[data-action="cancel"]');
        if (cancelBtn) {
            addTouchHandler(cancelBtn, function () {
                window.cancelInput();
            });
        }

        const okBtn = document.querySelector('.modal-actions button[data-action="ok"]');
        if (okBtn) {
            addTouchHandler(okBtn, function () {
                window.submitInput();
            });
        }
    });
}
