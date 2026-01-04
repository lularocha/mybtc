/**
 * android-keypad-fallback.js
 * Android Samsung Internet Browser Keypad Fallback
 * Simple native keyboard trigger without UI interference
 */

// Create namespace
window.MYBTC = window.MYBTC || {};

// Android Keypad Fallback module
window.MYBTC.AndroidFallback = (function() {
    
    // ==============================================
    // DETECTION
    // ==============================================
    
    /**
     * Detect if we should use native keypad instead of custom modal
     * @returns {boolean} True if should use native keypad
     */
    function shouldUseNativeKeypad() {
        const userAgent = navigator.userAgent;
        
        // Check for Samsung Internet specifically
        const isSamsungInternet = /SamsungBrowser/i.test(userAgent);
        
        // Check for Android
        const isAndroid = /Android/i.test(userAgent);
        
        // Check for other problematic Android browsers
        const isAndroidWebView = /wv\)/i.test(userAgent);
        
        // Return true if we detect problematic combinations
        return (isSamsungInternet && isAndroid) || 
               (isAndroid && isAndroidWebView);
    }
    
    // Store the detection result
    const USE_NATIVE_KEYPAD = shouldUseNativeKeypad();
    
    // ==============================================
    // SIMPLE NATIVE INPUT HANDLERS
    // ==============================================
    
    /**
     * Show native input for BTC/SATS using existing input elements
     */
    function showNativeBtcInput() {
        const btcDisplay = document.getElementById('BTC-amount-display');
        const btcInput = document.querySelector('.BTC-input');
        const Core = window.MYBTC.Core;
        
        // Hide display, show input (using existing elements and styles)
        btcDisplay.style.display = 'none';
        btcInput.style.display = 'block';
        
        // Get current value
        let currentValue = '0';
        if (Core.currentAmount !== null) {
            if (Core.btcUnit === 'BTC') {
                currentValue = Core.currentAmount.toFixed(8);
                currentValue = currentValue.replace(/\.?0+$/, '');
                if (currentValue === '') currentValue = '0';
            } else {
                currentValue = Math.round(Core.currentAmount * 100000000).toString();
                if (currentValue === '') currentValue = '0';
            }
        }
        
        // Set input value
        btcInput.value = Core.formatNumberWithCommas(currentValue, Core.btcUnit);
        
        // Set appropriate input type for mobile keypad
        if (Core.btcUnit === 'SATS') {
            btcInput.type = 'tel'; // Numbers only keypad
            btcInput.pattern = '[0-9]*';
            btcInput.inputMode = 'numeric';
        } else {
            btcInput.type = 'text'; // Full keypad with decimal
            btcInput.inputMode = 'decimal';
            btcInput.removeAttribute('pattern');
        }
        
        // Focus to show native keypad
        setTimeout(() => {
            btcInput.focus();
            btcInput.select();
        }, 100);
    }
    
    /**
     * Show native input for USD/BRL using existing input elements
     */
    function showNativeFiatInput() {
        const fiatDisplay = document.getElementById('USDBRL-amount-display');
        const fiatInput = document.querySelector('.fiat-input');
        const Core = window.MYBTC.Core;
        
        // Hide display, show input (using existing elements and styles)
        fiatDisplay.style.display = 'none';
        fiatInput.style.display = 'block';
        
        // Get current value
        let currentValue = '0';
        if (Core.currentAmount !== null && (Core.fiatUnit === 'USD' ? Core.currentPriceUSD : Core.currentPriceBRL)) {
            currentValue = ((Core.fiatUnit === 'USD' ? Core.currentPriceUSD : Core.currentPriceBRL) * Core.currentAmount).toFixed(2);
            currentValue = currentValue.replace(/\.?0+$/, '');
            if (currentValue === '') currentValue = '0';
        }
        
        // Set input value
        fiatInput.value = Core.formatNumberWithCommas(currentValue, Core.fiatUnit);
        
        // Set input type for numeric keypad
        fiatInput.type = 'tel';
        fiatInput.pattern = '[0-9]*';
        fiatInput.inputMode = 'decimal';
        
        // Focus to show native keypad
        setTimeout(() => {
            fiatInput.focus();
            fiatInput.select();
        }, 100);
    }
    
    /**
     * Override the original openModal function for Android devices
     */
    function overrideModalFunctions() {
        // Store original function if needed
        const originalOpenModal = window.MYBTC.UI.openModal;
        
        // Override with simple native input version
        window.MYBTC.UI.openModal = function(field) {
            if (field === 'btc') {
                showNativeBtcInput();
            } else {
                showNativeFiatInput();
            }
        };
        
        // Update global reference
        window.openModal = window.MYBTC.UI.openModal;
        
        // Completely disable the custom modal
        const modal = document.getElementById('keypadModal');
        if (modal) {
            modal.style.display = 'none !important';
            modal.style.visibility = 'hidden';
            modal.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Add minimal CSS to prevent layout issues
     */
    function addMinimalCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Prevent slide-up animation on Android native keypad mode */
            .android-native-keypad .main-container {
                transform: none !important;
                padding-bottom: 0 !important;
            }
            
            /* Ensure inputs are properly visible */
            .android-native-keypad .amount-input {
                font-size: 48px !important;
                padding: 10px 15px !important;
                min-height: 60px !important;
            }
            
            /* Responsive font size for mobile */
            @media (max-width: 768px) {
                .android-native-keypad .amount-input {
                    font-size: 20px !important;
                    padding: 12px !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add class to body to indicate native keypad mode
        document.body.classList.add('android-native-keypad');
    }
    
    /**
     * Initialize Android fallback if needed
     */
    function init() {
        if (USE_NATIVE_KEYPAD) {
            console.log('Android Samsung Internet detected - using simple native keypad fallback');
            
            // Wait for other modules to load
            document.addEventListener('DOMContentLoaded', function() {
                addMinimalCSS();
                overrideModalFunctions();
            });
        }
    }
    
    // ==============================================
    // PUBLIC API
    // ==============================================
    return {
        shouldUseNativeKeypad: () => USE_NATIVE_KEYPAD,
        init
    };
})();

// Auto-initialize
window.MYBTC.AndroidFallback.init();