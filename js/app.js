/**
 * app.js
 * Combined UI and utility functionality for myBTC Calculator
 */

// Fix for preventing zooming on Android
document.addEventListener(
  "touchmove",
  function (event) {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  },
  { passive: false },
);

// ==============================================
// HAPTIC FEEDBACK (Android — Vibration API)
// ==============================================
// Android browser haptics go through the Vibration API. Very short pulses can
// be too weak on some devices, so use a small-but-detectable tap duration.
const HAPTIC_TAP_MS = 45;
const HAPTIC_TARGET_SELECTOR = [
  "button",
  '[role="button"]',
  ".amount-display",
  ".theme-btn",
  "#current-BTC-change-display",
].join(",");

function triggerHapticFeedback(duration = HAPTIC_TAP_MS) {
  if (typeof navigator.vibrate !== "function") return false;

  try {
    return navigator.vibrate(duration);
  } catch {
    return false;
  }
}

document.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(HAPTIC_TARGET_SELECTOR)) {
      triggerHapticFeedback();
    }
  },
  { passive: true },
);

// ==============================================
// REFRESH ICON SPIN ANIMATION
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refresh");
  const refreshIcon = refreshButton?.querySelector(".icon-refresh");

  window.spinRefresh = function () {
    if (!refreshIcon) return;
    refreshIcon.classList.remove("spin");
    requestAnimationFrame(() => {
      refreshIcon.classList.add("spin");
    });
  };

  if (refreshButton) {
    refreshButton.addEventListener("click", window.spinRefresh);
  }
});

// ==============================================
// SETTINGS PANEL — language/theme controls plus help tabs
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.getElementById("settings");
  const settingsPanel = document.getElementById("settings-panel");

  if (settingsButton && settingsPanel) {
    const tabButtons = settingsPanel.querySelectorAll(".tab-btn");
    const tabPanes = settingsPanel.querySelectorAll(".tab-pane");

    const activateTab = (tabId) => {
      tabButtons.forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tab === tabId),
      );
      tabPanes.forEach((pane) =>
        pane.classList.toggle("active", pane.id === `tab-${tabId}`),
      );
    };

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    const openPanel = () => {
      activateTab("how-to-use"); // always open on the first tab
      settingsPanel.classList.add("open");
      settingsButton.setAttribute("aria-expanded", "true");
    };

    const closePanel = () => {
      settingsPanel.classList.remove("open");
      settingsButton.setAttribute("aria-expanded", "false");
    };

    settingsButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (settingsPanel.classList.contains("open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    const settingsCloseButton = document.getElementById("settings-close");
    settingsCloseButton?.addEventListener("click", closePanel);

    window.addEventListener("click", (event) => {
      if (
        !settingsPanel.contains(event.target) &&
        !settingsButton.contains(event.target)
      ) {
        closePanel();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanel();
    });
  }
});

// ==============================================
// DARK MODE LOGIC
// ==============================================
function toggleDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
    document.documentElement.classList.remove("dark-mode");
  }
}

function setupDarkModeToggle() {
  const themeButtons = document.querySelectorAll(".theme-btn");
  if (!themeButtons.length) return;

  const updateIcon = (isDark) => {
    themeButtons.forEach((button) =>
      button.classList.toggle(
        "active",
        button.dataset.theme === (isDark ? "dark" : "light"),
      ),
    );
  };

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const shouldUseDarkMode = button.dataset.theme === "dark";
      toggleDarkMode(shouldUseDarkMode);
      updateIcon(shouldUseDarkMode);
      localStorage.setItem("darkMode", shouldUseDarkMode);
    });
  });

  const savedDarkMode = localStorage.getItem("darkMode") === "true";
  if (savedDarkMode) {
    toggleDarkMode(true);
    updateIcon(true);
  } else {
    updateIcon(false);
  }
}

document.addEventListener("DOMContentLoaded", setupDarkModeToggle);

// ==============================================
// UI CORE LOGIC
// ==============================================
window.MYBTC.UI = (function () {
  const Core = window.MYBTC.Core;
  const API = window.MYBTC.API;

  // Which field the keypad is currently editing ("btc" | "fiat")
  let activeField = "btc";
  // Raw (un-grouped) value being typed into the active field
  let tempValue = "0";

  function updateDisplay() {
    const periodLabel =
      translations[Core.currentLang].periodLabels[Core.selectedPeriod];
    document.getElementById("current-BTC-change-label").textContent =
      periodLabel;

    const price = Core.getCurrentPrice(Core.fiatUnit);
    const symbol = Core.supportedCurrencies[Core.fiatUnit].symbol;

    const priceElement = document.getElementById("current-BTC-price-display");
    priceElement.querySelector(".fiat-symbol").textContent = symbol;
    const priceAmountSpan = priceElement.querySelector(
      ".current-BTC-price-amount",
    );
    priceAmountSpan.textContent =
      price !== null
        ? Core.fiatFormatter.format(price)
        : "Error fetching price";

    const btcDisplaySpan = document.querySelector(
      "#BTC-amount-display .BTC-amount",
    );
    let displayAmount;
    if (Core.currentAmount !== null) {
      displayAmount =
        Core.btcUnit === "BTC"
          ? Core.btcFormatter.format(Core.currentAmount)
          : Core.formatSats(Math.round(Core.currentAmount * 100000000));
    } else {
      displayAmount =
        Core.btcUnit === "BTC" ? Core.btcFormatter.format(0) : "000,000,000";
    }
    btcDisplaySpan.textContent = displayAmount;

    const fiatAmountSpan = document.querySelector(
      "#fiat-amount-display .fiat-amount",
    );
    fiatAmountSpan.textContent =
      price && Core.currentAmount
        ? Core.fiatFormatter.format(Core.currentAmount * price)
        : "0.00";

    const changeDisplay = document.getElementById("current-BTC-change-display");
    const arrowSpan = changeDisplay.querySelector(".arrow-symbol");
    const percentSpan = changeDisplay.querySelector(
      ".current-BTC-change-amount",
    );

    if (Core.currentPriceChangePercent !== null) {
      const arrow = Core.currentPriceChangePercent >= 0 ? "↑" : "↓";
      const absPercent = Math.abs(Core.currentPriceChangePercent).toFixed(1);
      arrowSpan.textContent = arrow;
      percentSpan.textContent = `${absPercent}%`;
      changeDisplay.style.color =
        Core.currentPriceChangePercent >= 0 ? "#090" : "#f00";
    } else {
      arrowSpan.textContent = "";
      percentSpan.textContent = "N/A";
      changeDisplay.style.color = "#000";
    }

    const btcText = btcDisplaySpan.textContent;
    btcDisplaySpan.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(btcText))}px`;

    const fiatText = fiatAmountSpan.textContent;
    fiatAmountSpan.style.fontSize = `${Core.getFontSizeUsdBrl(Core.countDigits(fiatText))}px`;
  }

  // Update the BTC toggle label and fiat dropdown label/selection
  function updateUnitButtons() {
    const btcLabel = document.querySelector(".btc-toggle .unit-label");
    if (btcLabel) btcLabel.textContent = Core.btcUnit;
    const fiatLabel = document.querySelector(".fiat-dropdown .unit-label");
    if (fiatLabel) fiatLabel.textContent = Core.fiatUnit;
    document.querySelectorAll("#fiat-menu button").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.currency === Core.fiatUnit);
    });
  }

  // Render the active field's display straight from the raw tempValue
  function renderActiveValue() {
    if (activeField === "btc") {
      const span = document.querySelector("#BTC-amount-display .BTC-amount");
      span.textContent = Core.formatNumberWithCommas(tempValue, Core.btcUnit);
      span.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(span.textContent))}px`;
    } else {
      const amountSpan = document.querySelector(
        "#fiat-amount-display .fiat-amount",
      );
      amountSpan.textContent = Core.formatNumberWithCommas(
        tempValue,
        Core.fiatUnit,
      );
      amountSpan.style.fontSize = `${Core.getFontSizeUsdBrl(Core.countDigits(amountSpan.textContent))}px`;
    }
  }

  // Render the non-active field as the live equivalent of tempValue
  function updateEquivalentValue() {
    const currentPrice = Core.getCurrentPrice(Core.fiatUnit);
    if (!currentPrice) return;
    const currentValue = tempValue.replace(/,/g, "");

    if (activeField === "btc") {
      let btcAmount =
        Core.btcUnit === "BTC"
          ? parseFloat(currentValue) || 0
          : (parseInt(currentValue, 10) || 0) / 100000000;
      const fiatValue = btcAmount * currentPrice;
      const fiatDisplaySpan = document.querySelector(
        "#fiat-amount-display .fiat-amount",
      );
      fiatDisplaySpan.textContent = Core.fiatFormatter.format(fiatValue);
      fiatDisplaySpan.style.fontSize = `${Core.getFontSizeUsdBrl(Core.countDigits(fiatDisplaySpan.textContent))}px`;
    } else {
      const fiatValue = parseFloat(currentValue) || 0;
      const btcValue = fiatValue / currentPrice;
      const btcDisplaySpan = document.querySelector(
        "#BTC-amount-display .BTC-amount",
      );
      btcDisplaySpan.textContent =
        Core.btcUnit === "BTC"
          ? Core.btcFormatter.format(btcValue)
          : Core.formatSats(Math.round(btcValue * 100000000));
      btcDisplaySpan.style.fontSize = `${Core.getFontSizeBtcSats(Core.countDigits(btcDisplaySpan.textContent))}px`;
    }
  }

  // Commit the typed value into Core.currentAmount (always stored as BTC)
  function commitCurrentAmount() {
    if (activeField === "btc") {
      Core.currentAmount =
        Core.btcUnit === "BTC"
          ? parseFloat(tempValue) || 0
          : (parseInt(tempValue, 10) || 0) / 100000000;
    } else {
      const price = Core.getCurrentPrice(Core.fiatUnit);
      if (price) Core.currentAmount = (parseFloat(tempValue) || 0) / price;
    }
  }

  // Seed tempValue from the stored amount for the active field
  function seedTempFromAmount() {
    if (activeField === "btc") {
      if (Core.currentAmount !== null) {
        tempValue =
          Core.btcUnit === "BTC"
            ? Core.currentAmount.toFixed(8).replace(/\.?0+$/, "")
            : Math.round(Core.currentAmount * 100000000).toString();
        if (tempValue === "") tempValue = "0";
      } else tempValue = "0";
    } else {
      const price = Core.getCurrentPrice(Core.fiatUnit);
      if (Core.currentAmount !== null && price) {
        tempValue = (price * Core.currentAmount)
          .toFixed(2)
          .replace(/\.?0+$/, "");
        if (tempValue === "") tempValue = "0";
      } else tempValue = "0";
    }
  }

  function setActiveField(field) {
    activeField = field;
    seedTempFromAmount();
    document
      .getElementById("BTC-amount-display")
      .classList.toggle("active-field", field === "btc");
    document
      .getElementById("fiat-amount-display")
      .classList.toggle("active-field", field === "fiat");
    updateDisplay();
    renderActiveValue();
  }

  function appendToDisplay(value) {
    let currentValue = tempValue.replace(/,/g, "");
    if (currentValue === "0" && value !== ".") currentValue = value;
    else if (value === "." && currentValue.includes(".")) return;
    else currentValue += value;

    if (activeField === "btc") {
      if (Core.btcUnit === "BTC") {
        let parts = currentValue.split(".");
        if (parts.length > 1 && parts[1].length > 8)
          parts[1] = parts[1].substring(0, 8);
        currentValue = parts.join(".");
      } else currentValue = currentValue.replace(/\D/g, "");
    } else {
      let parts = currentValue.split(".");
      if (parts.length > 1 && parts[1].length > 2)
        parts[1] = parts[1].substring(0, 2);
      currentValue = parts.join(".");
    }
    tempValue = currentValue;
    renderActiveValue();
    commitCurrentAmount();
    updateEquivalentValue();
  }

  function deleteLast() {
    let currentValue = tempValue.replace(/,/g, "").slice(0, -1);
    if (currentValue === "") currentValue = "0";
    tempValue = currentValue;
    renderActiveValue();
    commitCurrentAmount();
    updateEquivalentValue();
  }

  function toggleBtcUnit() {
    Core.btcUnit = Core.btcUnit === "BTC" ? "SATS" : "BTC";
    updateUnitButtons();
    seedTempFromAmount();
    updateDisplay();
    renderActiveValue();
  }

  function selectFiat(currency) {
    Core.fiatUnit = currency;
    updateUnitButtons();
    seedTempFromAmount();
    updateDisplay();
    renderActiveValue();
    closeFiatMenu();
  }

  function setupFiatMenu() {
    const menu = document.getElementById("fiat-menu");
    Object.keys(Core.supportedCurrencies).forEach((currency) => {
      const button = document.createElement("button");
      button.textContent = currency;
      button.dataset.currency = currency;
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        selectFiat(currency);
      });
      menu.appendChild(button);
    });
  }

  function toggleFiatMenu(e) {
    e.stopPropagation();
    document.getElementById("fiat-menu").classList.toggle("active");
  }

  function closeFiatMenu() {
    document.getElementById("fiat-menu").classList.remove("active");
  }

  function setupPeriodMenu() {
    const periodMenu = document.getElementById("period-menu");
    Core.periodCodes.forEach((code) => {
      const button = document.createElement("button");
      button.textContent =
        translations[Core.currentLang].periodDisplayCodes[code];
      button.setAttribute("data-period", code);
      button.addEventListener("click", () => {
        Core.selectedPeriod = code;
        document.getElementById("current-BTC-change-label").textContent =
          translations[Core.currentLang].periodLabels[code];
        periodMenu
          .querySelectorAll("button")
          .forEach((btn) =>
            btn.classList.toggle(
              "selected",
              btn.getAttribute("data-period") === Core.selectedPeriod,
            ),
          );
        API.fetchHistoricalBitcoinPrice(Core.selectedPeriod).then(
          (historicalPrice) => {
            Core.currentPriceChangePercent =
              Core.currentPriceUSD && historicalPrice
                ? ((Core.currentPriceUSD - historicalPrice) / historicalPrice) *
                  100
                : null;
            updateDisplay();
            renderActiveValue();
          },
        );
        periodMenu.classList.remove("active");
      });
      periodMenu.appendChild(button);
    });
    document
      .querySelector(`#period-menu button[data-period="1Y"]`)
      ?.classList.add("selected");
    const changeDisplay = document.getElementById("current-BTC-change-display");
    changeDisplay.addEventListener("click", () =>
      periodMenu.classList.toggle("active"),
    );
    document.addEventListener("click", (e) => {
      if (!changeDisplay.contains(e.target) && !periodMenu.contains(e.target))
        periodMenu.classList.remove("active");
    });
  }

  function updatePeriodMenuLanguage() {
    const periodMenu = document.getElementById("period-menu");
    periodMenu.querySelectorAll("button").forEach((button) => {
      button.textContent =
        translations[Core.currentLang].periodDisplayCodes[
          button.getAttribute("data-period")
        ];
    });
    if (Core.selectedPeriod)
      document.getElementById("current-BTC-change-label").textContent =
        translations[Core.currentLang].periodLabels[Core.selectedPeriod];
  }

  function applyPastedText(pastedText) {
    let cleanValue = pastedText.replace(/[^0-9.]/g, "");
    const dotParts = cleanValue.split(".");
    if (dotParts.length > 2)
      cleanValue = dotParts[0] + "." + dotParts.slice(1).join("");
    if (!cleanValue || cleanValue === ".") return;

    if (activeField === "btc") {
      if (Core.btcUnit === "BTC") {
        const parts = cleanValue.split(".");
        if (parts.length > 1 && parts[1].length > 8)
          parts[1] = parts[1].substring(0, 8);
        cleanValue = parts.join(".");
      } else {
        cleanValue = cleanValue.split(".")[0];
      }
    } else {
      const parts = cleanValue.split(".");
      if (parts.length > 1 && parts[1].length > 2)
        parts[1] = parts[1].substring(0, 2);
      cleanValue = parts.join(".");
    }
    tempValue = cleanValue || "0";
    renderActiveValue();
    commitCurrentAmount();
    updateEquivalentValue();
  }

  // Wire the transparent overlay inputs so the OS-native long-press "Paste"
  // (a single tap, no clipboard-permission prompt) drops straight into the
  // matching field. The inputs never hold a value — they only capture paste.
  function setupPasteCapture() {
    document.querySelectorAll(".paste-capture").forEach((input) => {
      const field = input.closest("#fiat-amount-display") ? "fiat" : "btc";

      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData)?.getData("text");
        setActiveField(field);
        if (text) applyPastedText(text);
        input.value = "";
        input.blur();
      });

      // Keep the overlay empty; the keypad is the only typing input method.
      input.addEventListener("input", () => {
        input.value = "";
      });
    });
  }

  function setupEventListeners() {
    // BTC/SATS toggle
    document.querySelector(".btc-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBtcUnit();
    });

    // Fiat currency dropdown
    document
      .querySelector(".fiat-dropdown")
      .addEventListener("click", toggleFiatMenu);
    setupFiatMenu();

    // Native long-press paste into the overlay inputs
    setupPasteCapture();

    // Tap a display to make it the active field
    document
      .getElementById("BTC-amount-display")
      .addEventListener("click", () => setActiveField("btc"));
    document
      .getElementById("fiat-amount-display")
      .addEventListener("click", () => setActiveField("fiat"));

    // Refresh price (re-derives the equivalent at the new price)
    document.getElementById("refresh").addEventListener("click", async () => {
      await API.fetchData();
      commitCurrentAmount();
      updateDisplay();
      renderActiveValue();
    });

    setupPeriodMenu();

    // Language switch
    document.querySelectorAll(".lang-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        Core.setLanguage(btn.getAttribute("data-lang"));
        updatePeriodMenuLanguage();
      }),
    );

    // Close fiat menu when clicking outside it
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("fiat-menu");
      const dropdown = document.querySelector(".fiat-dropdown");
      if (menu && !menu.contains(e.target) && !dropdown.contains(e.target)) {
        menu.classList.remove("active");
      }
    });

    window.addEventListener("resize", () => {
      updateDisplay();
      renderActiveValue();
    });
  }

  async function init() {
    setupEventListeners();
    await API.fetchData();
    updateUnitButtons();
    setActiveField("btc");
  }

  return {
    init,
    updateDisplay,
    updateUnitButtons,
    setActiveField,
    appendToDisplay,
    deleteLast,
  };
})();

window.appendToDisplay = window.MYBTC.UI.appendToDisplay;
window.deleteLast = window.MYBTC.UI.deleteLast;

document.addEventListener("DOMContentLoaded", () => {
  window.MYBTC.UI.init();
  window.MYBTC.Core.setLanguage("pt");
});
