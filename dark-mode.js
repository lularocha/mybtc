// MYBTC Calculator - Dark Mode Configuration
// 
// DARK MODE COLOR MAPPING
// Edit the values in the darkModeColors object below to customize your dark mode theme.
// Each property shows: darkModeColor // Original light mode color -> UI Element description

const darkModeColors = {
  // === MAIN BACKGROUNDS ===
  mainBackground: "#1a1a1b",        // #fe0 -> Main yellow background container
  secondaryBackground: "#2a2a2a",      // #fd0 -> Amount displays, unit buttons background
  pageBackground: "#000",           // Used for larger screens body background
  
  // === ACTIVE ELEMENTS ===
  activeButtons: "#f50",            // #f90 -> Active unit buttons, language buttons, period menu selected
  refreshButton: "#f50",            // #f80 -> Refresh button background
  buttonHover: "#f60",              // #f60 -> Button hover states (unchanged)
  languageButtons: "#fc0",          // #fc0 -> Language button background (unchanged)
  
  // === TEXT COLORS ===
  mainText: "#fff",                 // #000 -> Main text color (black text becomes white)
  whiteText: "#000",                // #fff -> White text/backgrounds become black
  
  // === STATUS COLORS ===
  positiveChange: "#0c0",           // #090 -> Positive percentage change (green)
  negativeChange: "#ff3333",        // #f00 -> Negative percentage change (red)
  
  // === HELP/INFO ELEMENTS ===
  helpButton: "#050",               // #00b129 -> Help button background (dark green)
  helpButtonHover: "#090",          // #009a22 -> Help button hover state
  
  // === PERIOD MENU SPECIFIC ===
  periodMenuBackground: "#2a2a2a",  // #fff -> Period menu container background
  periodMenuButton: "#3d3d3d",      // #ddd -> Period menu button background
  periodMenuButtonHover: "#555",    // #fff -> Period menu button hover background
  periodMenuButtonText: "#fff",     // #000 -> Period menu button text color
  periodMenuSelected: "#f50",       // #f90 -> Period menu selected button background
  periodMenuSelectedText: "#000",   // #fff -> Period menu selected button text color
  
  // === OTHER UI ELEMENTS ===
  mediumGray: "#999999",            // #666 -> Medium gray elements, markers
  shadows: "#0005",                 // #0005 -> Semi-transparent shadows (unchanged)
  linkHover: "#ffff33",             // #ff0 -> Link hover color
  
  // === CUSTOM UI COLORS ===
  darkElement: "#2a2a2a",           // Custom dark UI elements
  darkPanel: "#000",                // Info panel background
  footerText: "#fff",               // Footer text color
  panelTitle: "#f90",               // Info panel title color
  
  // === BUTTON TEXT COLORS ===
  activeButtonText: "#000",         // Text color for all active buttons
  nonActiveButtonText: "#ccc",      // Text color for non-active buttons
};

// Function to toggle dark mode on/off
function toggleDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  }
}

// Create all dark mode CSS styles
function createDarkModeStyles() {
  const styleEl = document.createElement('style');
  const colors = darkModeColors; // Shorthand reference
  
  styleEl.textContent = `
  /* === MAIN PAGE ELEMENTS === */
  .dark-mode, .dark-mode body {
    background-color: ${colors.mainBackground} !important;
    color: ${colors.mainText};
  }
  
  /* Override for larger screens */
  @media (min-width: 768px) {
    .dark-mode body {
      background-color: ${colors.pageBackground} !important;
    }
    body.dark-mode {
      background-color: ${colors.pageBackground} !important;
    }
  }
  
  .dark-mode .main-container {
    background-color: ${colors.mainBackground};
  }
  
  /* === TEXT ELEMENTS === */
  .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode a {
    color: ${colors.mainText};
  }
  
  /* === ICONS === */
  .dark-mode img.mybtclogo {
    filter: brightness(0.8);
  }
  
  .dark-mode img.info-icon {
    filter: invert(1);
  }
  
  /* === LANGUAGE BUTTONS === */
  .dark-mode button.lang-btn {
    background-color: ${colors.darkElement};
    color: ${colors.nonActiveButtonText};
  }
  
  .dark-mode button.lang-btn.active {
    background-color: ${colors.activeButtons};
    color: ${colors.activeButtonText};
  }
  
  /* === UNIT SELECTOR BUTTONS === */
  .dark-mode .unit-selector button.unit-btn {
    background-color: ${colors.darkElement};
    color: ${colors.nonActiveButtonText};
  }
  
  .dark-mode .unit-selector button.unit-btn.active {
    background-color: ${colors.activeButtons};
    color: ${colors.activeButtonText};
  }
  
  /* === AMOUNT DISPLAYS === */
  .dark-mode .amount-display {
    background-color: ${colors.secondaryBackground};
    color: ${colors.mainText};
  }
  
  .dark-mode .amount-input {
    background-color: ${colors.darkElement};
    color: ${colors.mainText};
    border-color: ${colors.activeButtons};
  }
  
  /* === PERIOD MENU === */
  .dark-mode .period-menu {
    background-color: ${colors.periodMenuBackground};
    box-shadow: 0 0 15px ${colors.shadows};
  }
  
  .dark-mode .period-menu button {
    background-color: ${colors.periodMenuButton};
    color: ${colors.periodMenuButtonText};
  }
  
  .dark-mode .period-menu button:hover {
    background-color: ${colors.periodMenuButtonHover};
  }
  
  .dark-mode .period-menu button.selected {
    background-color: ${colors.periodMenuSelected};
    color: ${colors.periodMenuSelectedText};
  }
  
  .dark-mode .period-menu button.selected:hover {
    background-color: ${colors.periodMenuSelected};
  }
  
  /* === ACTION BUTTONS === */
  .dark-mode .button-container button#info {
    background-color: ${colors.helpButton};
  }
  
  .dark-mode .button-container button#info:hover {
    background-color: ${colors.helpButtonHover};
  }
  
  .dark-mode .button-container button#refresh {
    background-color: ${colors.refreshButton};
  }
  
  .dark-mode .button-container button#refresh:hover {
    background-color: ${colors.buttonHover};
  }
  
  /* === HOVER STATES === */
  .dark-mode .keypad button:hover {
    background-color: ${colors.buttonHover};
  }
  
  /* === FOOTER === */
  .dark-mode .footer-info {
    color: ${colors.footerText};
  }
  
  .dark-mode .footer-info a {
    border-bottom: 1px dashed ${colors.footerText};
  }
  
  /* === INFO PANEL === */
  .dark-mode .info-panel {
    background-color: ${colors.darkPanel};
  }
  
  .dark-mode .close-btn {
    background-color: ${colors.darkElement};
  }
  
  .dark-mode h3.panel-title {
    color: ${colors.panelTitle};
  }
  
  .dark-mode .info-panel a {
    color: ${colors.footerText};
    border-bottom: 1px dashed ${colors.footerText};
  }
  
  /* === INFO MODAL === */
  .dark-mode .info-modal {
    background: ${colors.darkPanel};
    box-shadow: 0 2px 5px ${colors.shadows};
  }
  
  .dark-mode .info-modal p.modal-text[data-translate="infoModalText0"] {
    color: ${colors.panelTitle};
  }
  
  /* === DARK MODE TOGGLE ICON === */
  .dark-mode .dark-mode-icon {
    background: #333;
  }
  `;
  
  return styleEl;
}

// Create Material Symbol icon element
function createMaterialIcon(iconName) {
  const iconSpan = document.createElement('span');
  iconSpan.className = 'material-symbols-outlined';
  iconSpan.textContent = iconName;
  return iconSpan;
}

// Setup dark mode toggle functionality
function setupDarkModeToggle() {
  // Create and add the dark mode styles to the page
  const darkModeStyles = createDarkModeStyles();
  darkModeStyles.id = 'dark-mode-styles';
  document.head.appendChild(darkModeStyles);
  
  // Find the dark mode icon container
  const darkModeIconContainer = document.querySelector('.dark-mode-icon');
  
  if (darkModeIconContainer) {
    // Clear any placeholder text and add the moon icon (for light mode)
    darkModeIconContainer.innerHTML = '';
    const moonIcon = createMaterialIcon('dark_mode');
    darkModeIconContainer.appendChild(moonIcon);
    darkModeIconContainer.title = 'Toggle Dark Mode';
    
    // Add click handler for toggling dark mode
    darkModeIconContainer.addEventListener('click', () => {
      const isDarkMode = document.body.classList.contains('dark-mode');
      toggleDarkMode(!isDarkMode);
      
      // Update the icon based on current mode
      darkModeIconContainer.innerHTML = '';
      if (isDarkMode) {
        // Switching to light mode - show moon icon
        const moonIcon = createMaterialIcon('dark_mode');
        darkModeIconContainer.appendChild(moonIcon);
      } else {
        // Switching to dark mode - show sun icon
        const sunIcon = createMaterialIcon('light_mode');
        darkModeIconContainer.appendChild(sunIcon);
      }
      
      // Save preference to localStorage
      localStorage.setItem('darkMode', !isDarkMode);
    });
    
    // Check for saved dark mode preference and apply it
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      toggleDarkMode(true);
      // Show sun icon for dark mode
      darkModeIconContainer.innerHTML = '';
      const sunIcon = createMaterialIcon('light_mode');
      darkModeIconContainer.appendChild(sunIcon);
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupDarkModeToggle);

/**
 * === HOW TO CUSTOMIZE YOUR DARK MODE ===
 * 
 * To change colors:
 * 1. Edit the values in the darkModeColors object above
 * 2. Each property shows the original light mode color and which UI element it affects
 * 
 * To change button text colors:
 * - activeButtonText: Controls text color for all active/selected buttons
 * - nonActiveButtonText: Controls text color for non-active buttons
 * 
 * To change the toggle icons:
 * - Edit the icon names in createMaterialIcon() calls:
 *   - 'dark_mode' (moon icon for light mode)
 *   - 'light_mode' (sun icon for dark mode)
 * 
 * Alternative icon options:
 * - 'brightness_6' (half sun/moon)
 * - 'wb_sunny' (alternative sun)
 * - 'nightlight' (alternative moon)
 * 
 * Example custom theme (Blue Night):
 * mainBackground: "#001a2a",     // Dark blue instead of dark gray
 * activeButtons: "#3498db",      // Bright blue instead of orange
 * pageBackground: "#0a192f",     // Even darker blue for body
 */