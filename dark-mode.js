// Dark Mode Color Mapping for MYBTC Calculator

/**
 * DARK MODE COLOR MAPPING
 * 
 * Original color : Dark Mode equivalent // UI Element description
 * 
 * #fe0 : #1a1a1a // Main yellow background, main container
 * #fd0 : #222 // Secondary yellow background, unit buttons, amount display
 * #f90 : #f50 // Active buttons (unit selector, language, period menu)
 * #f80 : #f50 // Refresh button
 * #f60 : #f60 // Button hover states
 * #fc0 : #fc0 // Language buttons
 * #000 : #fff // Main text color
 * #fff : #000 // White text/backgrounds
 * #090 : #00cc00 // Positive change percentage
 * #f00 : #ff3333 // Negative change percentage
 * #00b129 : #050 // Help button
 * #009a22 : #00b327 // Help button hover
 * #ddd : #3d3d3d // Light gray (period menu buttons)
 * #666 : #999999 // Medium gray (markers)
 * #0005 : #0005 // Semi-transparent shadows
 * #ff0 : #ffff33 // Link hover
 */

// Simple object mapping original colors to dark mode colors
// EDIT THESE VALUES TO CUSTOMIZE YOUR DARK MODE
const darkModeMap = {
  // Main backgrounds
  "#fe0": "#1a1a1a", // Main yellow background
  "#fd0": "#222", // Secondary yellow background
  
  // Active elements
  "#f90": "#f50", // Active buttons
  "#f80": "#f50", // Refresh button
  "#f60": "#f60", // Button hover states
  "#fc0": "#fc0", // Language buttons
  
  // Text colors
  "#000": "#fff", // Main text color
  "#fff": "#000", // White text/backgrounds
  
  // Status colors
  "#090": "#00cc00", // Positive change 
  "#f00": "#ff3333", // Negative change
  
  // Help/Info elements
  "#00b129": "#050", // Help button
  "#009a22": "#00b327", // Help button hover
  
  // UI elements
  "#ddd": "#3d3d3d", // Light gray
  "#666": "#999999", // Medium gray
  "#0005": "#0005", // Semi-transparent shadows
  "#ff0": "#ffff33", // Link hover
};

// These are necessary UI element colors for dark mode
const uiColors = {
  darkBackground: "#1a1a1a", // Page background
  darkElement: "#2a2a2a",    // Dark UI elements
  darkPanel: "#000",      // Info panel background
  footerText: "#fff",     // Footer text
  
  // Custom text colors for buttons
  activeButtonText: "#000", // Text color for all active buttons
  nonActiveButtonText: "#ccc" // Text color for non-active buttons
};

// Function to toggle dark mode
function toggleDarkMode(enabled) {
  // Apply or remove dark mode class
  if (enabled) {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  }
}

// Create dark mode styles based on the color mapping
function createDarkModeStyles() {
  const styleEl = document.createElement('style');
  
  // Basic dark mode styles using the color map
  styleEl.textContent = `
  /* Main page elements */
  .dark-mode, .dark-mode body {
    background-color: ${uiColors.darkBackground} !important;
    color: ${darkModeMap["#000"]};
  }
  
  /* Override for larger screens */
  @media (min-width: 768px) {
    .dark-mode body {
      background-color: #111 !important;
    }
    body.dark-mode {
      background-color: #111 !important;
    }
  }
  
  .dark-mode .main-container {
    background-color: ${darkModeMap["#fe0"]};
  }
  
  /* Text elements */
  .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode a {
    color: ${darkModeMap["#000"]};
  }
  
  /* Icons */
  .dark-mode img.mybtclogo {
    filter: brightness(0.8);
  }
  
  .dark-mode img.info-icon {
    filter: invert(1);
  }
  
  /* Language buttons */
  .dark-mode button.lang-btn {
    background-color: ${uiColors.darkElement};
    color: ${uiColors.nonActiveButtonText};
  }
  
  .dark-mode button.lang-btn.active {
    background-color: ${darkModeMap["#f90"]};
    color: ${uiColors.activeButtonText}; /* Using the custom text color */
  }
  
  /* Unit selector buttons */
  .dark-mode .unit-selector button.unit-btn {
    background-color: ${uiColors.darkElement};
    color: ${uiColors.nonActiveButtonText};
  }
  
  .dark-mode .unit-selector button.unit-btn.active {
    background-color: ${darkModeMap["#f90"]};
    color: ${uiColors.activeButtonText}; /* Using the custom text color */
  }
  
  /* Amount displays */
  .dark-mode .amount-display {
    background-color: ${darkModeMap["#fd0"]};
    color: ${darkModeMap["#000"]};
  }
  
  .dark-mode .amount-input {
    background-color: ${uiColors.darkElement};
    color: ${darkModeMap["#000"]};
    border-color: ${darkModeMap["#f90"]};
  }
  
  /* Period menu */
  .dark-mode .period-menu {
    background-color: ${uiColors.darkElement};
    box-shadow: 0 0 15px ${darkModeMap["#0005"]};
  }
  
  .dark-mode .period-menu button {
    background-color: ${uiColors.darkElement};
    color: ${uiColors.nonActiveButtonText};
  }
  
  .dark-mode .period-menu button.selected {
    background-color: ${darkModeMap["#f90"]};
    color: ${uiColors.activeButtonText}; /* Using the custom text color */
  }
  
  /* Action buttons */
  .dark-mode .button-container button#info {
    background-color: ${darkModeMap["#00b129"]};
  }
  
  .dark-mode .button-container button#refresh {
    background-color: ${darkModeMap["#f80"]};
  }
  
  /* Footer */
  .dark-mode .footer-info {
    color: ${uiColors.footerText};
  }
  
  .dark-mode .footer-info a {
    border-bottom: 1px dashed ${uiColors.footerText};
  }
  
  /* Info panel */
  .dark-mode .info-panel {
    background-color: ${uiColors.darkPanel};
  }
  
  .dark-mode .close-btn {
    background-color: ${uiColors.darkElement};
  }
  
 .dark-mode h3.panel-title {
    color: #f90;
  }
  
  .dark-mode .info-panel a {
    color: ${uiColors.footerText};
    border-bottom: 1px dashed ${uiColors.footerText};
  }
  
  .dark-mode .info-modal {
    background: ${uiColors.darkPanel};
    box-shadow: 0 2px 5px ${darkModeMap["#0005"]};
  }
  
  .dark-mode .info-modal p.modal-text[data-translate="infoModalText0"] {
    color: #f90;
  }
  `;
  
  return styleEl;
}

// Setup dark mode toggle in the footer
function setupDarkModeToggle() {
  // Create the style element
  const darkModeStyles = createDarkModeStyles();
  darkModeStyles.id = 'dark-mode-styles';
  document.head.appendChild(darkModeStyles);
  
  // Find the dark mode icon container
  const darkModeIconContainer = document.querySelector('.dark-mode-icon');
  
  if (darkModeIconContainer) {
    // Clear any placeholder text
    darkModeIconContainer.textContent = '🌙';
    darkModeIconContainer.title = 'Toggle Dark Mode';
    
    // Add click handler
    darkModeIconContainer.addEventListener('click', () => {
      const isDarkMode = document.body.classList.contains('dark-mode');
      toggleDarkMode(!isDarkMode);
      darkModeIconContainer.textContent = isDarkMode ? '🌙' : '☀️';
      localStorage.setItem('darkMode', !isDarkMode);
    });
    
    // Check for saved preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      toggleDarkMode(true);
      darkModeIconContainer.textContent = '☀️';
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupDarkModeToggle);

/**
 * HOW TO CUSTOMIZE DARK MODE:
 * 
 * To create your own color scheme, simply edit the colors in the darkModeMap object.
 * Each entry shows the original color and its dark mode equivalent.
 * 
 * To change the text colors of buttons:
 * 1. Find the uiColors object
 * 2. Change these values:
 *    - activeButtonText: Controls text color for all active buttons
 *    - nonActiveButtonText: Controls text color for non-active buttons
 * 
 * Example:
 * uiColors = {
 *   ...
 *   activeButtonText: "#000",   // Black text for active buttons
 *   nonActiveButtonText: "#aaa" // Light gray for non-active buttons
 * };
 * 
 * For a completely different theme like "Blue Night":
 * 
 * // Change these values in darkModeMap:
 * "#fe0": "#001a2a",  // Main background - dark blue
 * "#fd0": "#001a2a",  // Secondary background - dark blue  
 * "#f90": "#3498db",  // Active buttons - bright blue
 * 
 * // And in uiColors:
 * darkBackground: "#0a192f", // Even darker blue for page background
 */