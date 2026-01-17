class Stock{
    constructor(symbol, companyName, startingPrice, currentPrice, volatility, lastUpdated){
        this.symbol = symbol;
        this.companyName = companyName;
        this.startingPrice = startingPrice;
        this.currentPrice = currentPrice;
        this.volatility = volatility;
        this.lastUpdated = lastUpdated;
    }
}
module.exports = Stock;