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
    return res.json({ balance: balance || 0 });
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
