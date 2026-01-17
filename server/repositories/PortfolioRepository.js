class PortfolioRepository {
    constructor(db) {
        this.db = db;
    }

    getPortfolioByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM portfolios WHERE user_id = ?`;
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }
    buy(userId, stockId, quantity, totalCost) {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO portfolios (user_id, stock_id, quantity, total_cost)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, stock_id) DO UPDATE SET
            quantity = portfolios.quantity + excluded.quantity,
            total_cost = portfolios.total_cost + excluded.total_cost
        `;

        this.db.run(query, [userId, stockId, quantity, totalCost], function (err) {
            if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    }


   sell(userId, stockId, quantity) {
        return new Promise((resolve, reject) => {
        const query = `
        UPDATE portfolios
        SET quantity = quantity - ?
        WHERE user_id = ? AND stock_id = ? AND quantity >= ?
        `;
        this.db.run(query, [quantity, userId, stockId, quantity], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
    }

    getPortfolioByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM portfolios WHERE user_id = ?`;
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    buy(userId, stockId, quantity, totalCost) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO portfolios (user_id, stock_id, quantity, total_cost)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, stock_id) DO UPDATE SET
                    quantity = portfolios.quantity + excluded.quantity,
                    total_cost = portfolios.total_cost + excluded.total_cost
            `;

            this.db.run(query, [userId, stockId, quantity, totalCost], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    }

    sell(userId, stockId, quantity) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE portfolios
                SET quantity = quantity - ?
                WHERE user_id = ? AND stock_id = ? AND quantity >= ?
            `;
            this.db.run(query, [quantity, userId, stockId, quantity], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = PortfolioRepository;