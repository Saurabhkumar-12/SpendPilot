let ratesCache = null;
let lastFetched = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const fallbackRates = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0
};

export const exchangeRateService = {
  async getExchangeRates(baseCurrency = 'USD') {
    const now = Date.now();
    if (ratesCache && (now - lastFetched < CACHE_DURATION)) {
      return ratesCache;
    }

    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          ratesCache = data.rates;
          lastFetched = now;
          return ratesCache;
        }
      }
    } catch (err) {
      console.warn('Exchange Rate API failed, using cached fallback rates:', err.message);
    }

    ratesCache = fallbackRates;
    return fallbackRates;
  },

  async convertCurrency(amount, from, to) {
    const rates = await this.getExchangeRates('USD');
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    const inUSD = amount / fromRate;
    return Math.round((inUSD * toRate) * 100) / 100;
  }
};
