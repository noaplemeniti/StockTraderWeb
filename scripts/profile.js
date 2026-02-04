document.addEventListener("DOMContentLoaded", async () => {
  const usernameElement = document.getElementById("username");
  const emailElement = document.getElementById("email");
  const createdAtElement = document.getElementById("created-at");
  const totalBalanceElement = document.getElementById("total-balance");
  const stocksValueElement = document.getElementById("stocks-value");
  const stocksOwnedElement = document.getElementById("stocks-owned");

  function renderData(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  async function renderUserData() {
        try {
            const res = await fetch("/api/user/info");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            usernameElement.textContent = data.username || "Not found.";
            emailElement.textContent = data.email || "Not found.";
            createdAtElement.textContent = data.createdAt ? renderData(data.createdAt) : "Not found.";
            totalBalanceElement.textContent = data.balance ? Number(data.balance).toFixed(2) : "0.00";
        } catch (err) {
            console.error("Failed to fetch user info:", err);
            usernameElement.textContent = "Error loading data.";
            emailElement.textContent = "Error loading data.";
            createdAtElement.textContent = "Error loading data.";
        }
    }

    async function renderPortfolioSummary() {
        try {
            const res = await fetch("/api/user/portfolio");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { portfolio } = await res.json();
            const stocksOwned = Array.isArray(portfolio) ? portfolio.length : 0;
            let stocksValue = 0;
            for (const stock of portfolio) {
                const currentPrice = Number(stock.current_price) || 0;
                const quantity = Number(stock.quantity) || 0;
                stocksValue += currentPrice * quantity;
            }
            stocksValueElement.textContent = stocksValue.toFixed(2);
            stocksOwnedElement.textContent = stocksOwned;
        } catch (err) {
            console.error("Failed to fetch portfolio summary:", err);
        }
    }
    
    renderUserData();
    renderPortfolioSummary();
});
