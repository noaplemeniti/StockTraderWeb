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

    buy(userId, stockId, stockSymbol, quantity, totalCost) {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO portfolios (user_id, stock_id, stock_symbol, quantity, total_cost)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, stock_id) DO UPDATE SET
            quantity = portfolios.quantity + excluded.quantity,
            total_cost = portfolios.total_cost + excluded.total_cost
        `;

        this.db.run(query, [userId, stockId, stockSymbol, quantity, totalCost], function (err) {
            if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    }


    sell(userId, stockId, qtySold) {
    return new Promise((resolve, reject) => {
    this.db.serialize(() => {
      this.db.run("BEGIN IMMEDIATE TRANSACTION");
      this.db.get(
        `SELECT quantity, total_cost
         FROM portfolios
         WHERE user_id = ? AND stock_id = ?`,
        [userId, stockId],
        (err, row) => {
          if (err) {
            this.db.run("ROLLBACK");
            return reject(err);
          }
          if (!row) {
            this.db.run("ROLLBACK");
            return resolve({ changes: 0, reason: "no_row" });
          }

          const ownedQty = Number(row.quantity) || 0;
          const totalCost = Number(row.total_cost) || 0;

          if (qtySold > ownedQty || qtySold <= 0) {
            this.db.run("ROLLBACK");
            return resolve({ changes: 0, reason: "not_enough" });
          }

          const avgCost = ownedQty > 0 ? totalCost / ownedQty : 0;
          const newQty = ownedQty - qtySold;
          const newTotalCost = newQty > 0 ? totalCost - (avgCost * qtySold) : 0;

          if (newQty === 0) {
            this.db.run(
              `DELETE FROM portfolios
               WHERE user_id = ? AND stock_id = ?`,
              [userId, stockId],
              function (err2) {
                if (err2) {
                  return reject(err2);
                }
                resolve({ changes: 1, deleted: true });
              }
            );
          } else {
            this.db.run(
              `UPDATE portfolios
               SET quantity = ?, total_cost = ?
               WHERE user_id = ? AND stock_id = ?`,
              [newQty, newTotalCost, userId, stockId],
              function (err2) {
                if (err2) {
                  return reject(err2);
                }
                resolve({ changes: 1, deleted: false });
              }
            );
          }
        }
      );

      this.db.run("COMMIT", (commitErr) => {
        if (commitErr) {
          this.db.run("ROLLBACK");
          return reject(commitErr);
        }
      });
    });
  });
    }

    deleteStockFromPortfolio(userId, stockId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM portfolios WHERE user_id = ? AND stock_id = ? AND quantity <= 0`;
            this.db.run(query, [userId, stockId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    getPortfolioByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT p.stock_id, p.stock_symbol, p.quantity, p.total_cost, s.current_price
            FROM portfolios p
            JOIN stocks s ON p.stock_id = s.id
            WHERE p.user_id = ?`;
            this.db.all(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    getUserProfitLoss(userId) {
        return new Promise((resolve, reject) => {
            const query = `
            SELECT SUM((s.current_price * p.quantity) - p.total_cost) AS profit_loss
            FROM portfolios p
            JOIN stocks s ON p.stock_id = s.id
            WHERE p.user_id = ?
            `;
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row?.profit_loss ?? 0);
            })   
        });
    }

    deletePortfolioByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM portfolios WHERE user_id = ?`;
            this.db.run(query, [userId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }            
}

module.exports = PortfolioRepository;