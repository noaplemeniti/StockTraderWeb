class UserRepository {
    constructor(db) {
        this.db = db;
    }

    getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE username = ?`;
            this.db.get(query, [username], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            this.db.get(query, [email], (err, row) => {
                if(err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    getUserById(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE id = ?`;
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    createUser(username, email, passwordHash) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO users (username, email, password_hash, balance) VALUES (?, ?, ?, 0)`;
            this.db.run(query, [username, email, passwordHash], function(err){
                if(err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    getUserBalance(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT balance FROM users WHERE id = ?`; 
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row ? row.balance : null);
            });
        });
    }

    updateUserBalance(userId, newBalance) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE users SET balance = ? WHERE id = ?`;  
            this.db.run(query, [newBalance, userId], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
    }
}

module.exports = UserRepository;