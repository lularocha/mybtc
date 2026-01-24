# MYBTC

A simple Bitcoin calculator that converts between BTC/SATS and multiple fiat currencies with live price data.

## Features

- Convert between BTC and Satoshis (SATS)
- Multi-currency support: USD, BRL, EUR, GBP
- Live Bitcoin price from API
- Price change tracking (24h, 7d, 30d, 12m)
- Multi-language (English/Portuguese)
- Mobile-friendly with custom keypad
- No dependencies - pure HTML/CSS/JS

## Project Structure

```
mybtc/
├── index.html      # Main application
├── css/
│   └── styles.css  # Styling
├── js/
│   ├── core.js     # Core conversion logic
│   └── app.js      # UI and interactions
├── assets/         # Icons and images
└── archive/        # Previous versions
```

## Usage

Open `index.html` in a browser, or serve with any static server:

```bash
python -m http.server
```

## API

Uses CoinGecko API for live Bitcoin prices.
