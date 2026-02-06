const express = require("express");
const path = require("path");
const session = require("express-session");

const db = require("../db/database");
const StockRepository = require("./repositories/StockRepository");
const UserRepository = require("./repositories/UserRepository");
const PortfolioRepository = require("./repositories/PortfolioRepository");
const { hashPassword, verifyPassword } = require("./utils/passwordUtils");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "dev-secret-key",
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, "..")));

const stockRepository = new StockRepository(db);
const userRepository = new UserRepository(db);
const portfolioRepository = new PortfolioRepository(db);

app.get("/api/stocks", async (req, res) => {
  try {
    const stocks = await stockRepository.getAllStocks();
    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stocks." });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body ?? {};

  if(!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if(password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  if(!userRepository.validateEmailFormat(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try{
    const existingUser = await userRepository.getUserByUsername(username);
    if(existingUser) {
      return res.status(409).json({ error: "Username already taken." });
    }

    const existingEmail = await userRepository.getUserByEmail(email);
    if(existingEmail) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const passwordHash = await hashPassword(password);
    await userRepository.createUser(username, email, passwordHash);
    return res.redirect("/pages/login.html");
  }
  catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to register user." });
  }

});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) {
    return res.status(400).json({ error: "Missing fields." });
  }
  try {
    const user = await userRepository.getUserByUsername(username);
    if(!user) {
      return res.status(401).json({ error: "User does not exist." });
    }
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if(!passwordMatch) {
      return res.status(401).json({ error: "Invalid password." });
    }
    req.session.userId = user.id;
    return res.json({ message: "Login successful." });
  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/api/buy", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });

  const { stockId, stockSymbol, quantity } = req.body ?? {};
  const qty = Number(quantity);
  const sid = Number(stockId);

  if (!Number.isInteger(sid) || sid <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid stockId or quantity." });
  }

  try {
    const user = await userRepository.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const stock = await stockRepository.getStockById(sid);
    if (!stock) return res.status(404).json({ error: "Stock not found." });

    const totalCost = qty * Number(stock.current_price);
    const balance = Number(user.balance) || 0;

    if (balance < totalCost) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    await portfolioRepository.buy(userId, sid, stockSymbol, qty, totalCost);
    await userRepository.updateUserBalance(userId, balance - totalCost);

    return res.json({ message: "Stock purchased successfully." });
  } catch (err) {
    console.error("BUY ERROR:", err?.message, err);
    return res.status(500).json({ error: "Failed to purchase stock.", details: err?.message });
  }
});

app.post("/api/sell", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });

  const { stockId, quantity } = req.body ?? {};
  const qty = Number(quantity);
  const sid = Number(stockId);

  if (!Number.isInteger(sid) || sid <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid stockId or quantity." });
  }

  try {
    const user = await userRepository.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const stock = await stockRepository.getStockById(sid);
    if (!stock) return res.status(404).json({ error: "Stock not found." });
    await portfolioRepository.deleteStockFromPortfolio(userId, sid);
    await portfolioRepository.sell(userId, sid, qty);

    const totalProceeds = qty * Number(stock.current_price);
    const balance = Number(user.balance) || 0;

    await userRepository.updateUserBalance(userId, balance + totalProceeds);

    return res.json({ message: "Stock sold successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to sell stock." });
  }
});

app.get("/api/user/balance", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  try {
    const balance = await userRepository.getUserBalance(userId);
    return res.json({ balance: Number(balance) || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch user balance." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Failed to logout:", err);
      return res.status(500).json({ error: "Failed to logout." });
    }
    res.redirect("/pages/login.html");
  });
});

app.get('/api/user/portfolio', async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  try {
    const portfolio = await portfolioRepository.getPortfolioByUserId(userId);
    const profitLoss = await portfolioRepository.getUserProfitLoss(userId);
    return res.json({ portfolio: portfolio || [], profitLoss: profitLoss || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch portfolio." });
  }
});

app.get("/api/user/portfolioValue", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  try {
    const portfolioValue = await portfolioRepository.getPortfolioValue(userId);
    return res.json({ portfolioValue: portfolioValue || 0 });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch portfolio value." });
  }
});

app.get("/api/user/profitLoss", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  try {
    const profitLoss = await portfolioRepository.getUserProfitLoss(userId);
    return res.json({ profitLoss: profitLoss || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch profit/loss." });
  }
});

app.get('/api/user/info', async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  try {
    const user = await userRepository.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({
      username: user.username,
      email: user.email,
      createdAt: user.created_at
    });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch user info." });
  }
});

app.put("/api/user/updatePassword", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  const { currentPassword, newPassword, confirmNewPassword } = req.body ?? {};

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: "New passwords do not match." });
  }
  try {
    const user = await userRepository.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const passwordMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    const newHashedPassword = await hashPassword(newPassword);
    await userRepository.updateUserPassword(userId, newHashedPassword);
    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update password." });
  }
});

app.put("/api/user/updateEmail", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in."})
  const { newEmail } = req.body ?? {};

  if (!newEmail) {
    return res.status(400).json({ error: "New email is required." });
  }

  if (!userRepository.validateEmailFormat(newEmail)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  try {
    const existingEmail = await userRepository.getUserByEmail(newEmail);
    if (existingEmail) {
      return res.status(409).json({ error: "Email already in use." });
    }
    await userRepository.updateUserEmail(userId, newEmail);
    return res.json({ message: "Email updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update email." });
  }
});

app.put("/api/user/updateUsername", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in."})
  const { newUsername } = req.body ?? {};
  if (!newUsername) {
    return res.status(400).json({ error: "New username is required." });
  }
  try {
    const existingUser = await userRepository.getUserByUsername(newUsername); 
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken." });
    }
    await userRepository.updateUsername(userId, newUsername);
    return res.json({ message: "Username updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update username." });
  }
});

app.delete("/api/user/deleteAccount", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in."});
  try {
    await portfolioRepository.deletePortfolioByUserId(userId);
    await userRepository.deleteUserById(userId);
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session after account deletion:", err);
      }
      return res.json({ message: "Account deleted successfully." });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete account." });
  }
});

app.get("/api/stocks/:stockId", async (req, res) => {
  const stockId = Number(req.params.stockId);
  if (!Number.isInteger(stockId)) {
    return res.status(400).json({ error: "Invalid stockId." });
  }
  try {
    const stock = await stockRepository.getStockById(stockId);
    return res.json(stock);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch stock." });
  }
});

app.post("/api/user/addFunds", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No user logged in." });
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }
  try {
    const currentBalance = Number(await userRepository.getUserBalance(userId)) || 0;
    const newBalance = currentBalance + amount;
    await userRepository.updateUserBalance(userId, newBalance);
    return res.json({ message: "Funds added successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update balance." });
  }
});

let updating = false;

setInterval(async () => {
  const stocks = await stockRepository.getAllStocks();

  for (const stock of stocks) {
    const shock = normalRandom();
    let newPrice =
      stock.current_price * Math.exp(stock.volatility * shock);

    newPrice = Math.max(0.01, newPrice);
    await stockRepository.updateStockPrice(stock.id, newPrice);
  }

  console.log("Prices updated.");
}, 5000);



function normalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
