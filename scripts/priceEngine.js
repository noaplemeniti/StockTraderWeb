function calculatePrice(stock) {
    const price = stock.price + (stock.volatility * Math.random() * 2) - stock.volatility;
    stock.price = parseFloat(Math.max(price, 0).toFixed(2));
}

function updatePrices() {
    stocks = loadStocks();
    stocks.forEach(calculatePrice);
    return stocks;
}

