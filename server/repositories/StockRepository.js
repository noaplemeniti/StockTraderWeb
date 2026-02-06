class StockRepository {
    constructor(db) {
        this.db = db;
    }

    getAllStocks() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM stocks`;
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    getStockById(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM stocks WHERE id = ?`;
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    getStockBySymbol(symbol) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM stocks WHERE symbol = ?`;
            this.db.get(query, [symbol], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    updateStockPrice(id, newPrice) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE stocks SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`;
            this.db.run(query, [newPrice, id], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
    }
}

module.exports = StockRepository;