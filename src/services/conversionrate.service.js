import NodeCache from 'node-cache';

const conversionRateCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

async function fetchExchangeRate(currency) {
    const url = `https://api.budjet.org/fiat/${currency.toUpperCase()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}


export const getExchangeRates = async (currency) => {
    // const currency = req.params.currency.toUpperCase();
    const cacheKey = `exchange_${currency}`;

    // 1. Check cache
    let data = conversionRateCache.get(cacheKey);

    if (data) {
        // console.log(`Cache HIT for ${currency}`);
        return data;
    }

    // 2. Cache miss – fetch from external API
    // console.log(`Cache MISS for ${currency}, fetching from API...`);
    data = await fetchExchangeRate(currency);

    // 3. Store in cache
    conversionRateCache.set(cacheKey, data);

    // 4. Return response
    return data;

};