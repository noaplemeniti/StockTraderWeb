document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#stocks-table tbody");
    const balanceDisplay = document.getElementById("user-balance");
    const portfolioValueDisplay = document.getElementById("portfolio-value");
    const profitLossDisplay = document.getElementById("profit-loss");

    const closeBtnModal = document.getElementById("close-modal");
    const sellBtnModal = document.getElementById("sell-stock-modal");
    const balanceModal = document.getElementById("balance-modal");
    const quantityInputModal = document.getElementById("quantity-input-modal");
    const quantityOwnedModal = document.getElementById("quantity-owned-modal");
    const averagePriceModal = document.getElementById("average-price-modal");
    const currentPriceModal = document.getElementById("current-price-modal");
    const profitLossModal = document.getElementById("profit-loss-modal");
    const errorModal = document.getElementById("error-modal");
    const sellModal = document.getElementById("sell-modal");
    const userBalanceDashboard = document.getElementById("user-balance-dashboard");
    const portfolioValueDashboard = document.getElementById("portfolio-value-dashboard");

    const addFundsBtn = document.getElementById("add-funds");
    const fundsModalClose = document.getElementById("close-funds-modal")
    const addFundsModalOverlay = document.getElementById("add-funds-modal");
    const addFundsSubmit = document.getElementById("add-funds-submit");
    const currentBalance = document.getElementById("current-balance");
    const fundsErrorModal = document.getElementById("funds-error-modal");


    if(!tableBody) console.error("Table body not found");
    if(!balanceDisplay) console.error("Balance display not found");
    if(!portfolioValueDisplay) console.error("Portfolio value display not found");
    if(!profitLossDisplay) console.error("Profit/Loss display not found");
    if(!closeBtnModal) console.error("Close button modal not found");
    if(!sellBtnModal) console.error("Sell button modal not found");
    if(!balanceModal) console.error("Balance modal not found");
    if(!quantityInputModal) console.error("Quantity input modal not found");
    if(!quantityOwnedModal) console.error("Quantity owned modal not found");
    if(!averagePriceModal) console.error("Average price modal not found");
    if(!currentPriceModal) console.error("Current price modal not found");
    if(!profitLossModal) console.error("Profit/Loss modal not found");
    if(!errorModal) console.error("Error modal not found");
    if(!sellModal) console.error("Sell modal not found");

    const modalState = {
        stockId: null,
        stockSymbol: null,
        stockPrice: 0,
        quantityOwned: 0,
        averagePrice: 0,
        profitLoss: 0
    };

    let portfolioData = [];

    async function renderDashboardData(){
        await fetchBalance();
        await getPortfolioValue();
        userBalanceDashboard.textContent = formatPrice(Number(balanceDisplay.textContent) || 0);
        portfolioValueDashboard.textContent = formatPrice(Number(portfolioValueDisplay.textContent) || 0);
    }

    function formatPrice(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "-";
        return `${num.toFixed(2)}`;
    }

    function displayProfitLoss(profitLoss) {
        const num = Number(profitLoss);
        if (!Number.isFinite(num)) {
            profitLossDisplay.textContent = "-";
            return;
        }
        const formatted = num.toFixed(2);
        profitLossDisplay.textContent = formatted;
    }

    async function renderTable(portfolio) {
    const safePortfolio = Array.isArray(portfolio) ? portfolio : [];
    tableBody.innerHTML = "";

    if (safePortfolio.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No stocks in portfolio.</td></tr>`;
        return;
    }

    try {
        const stockPromises = safePortfolio.map(item => fetchStock(item.stock_id));

        const stocks = await Promise.all(stockPromises);

        safePortfolio.forEach((item, index) => {
            const stock = stocks[index];
            const rawProfit = (stock.current_price * item.quantity) - item.total_cost;

            const isPositive = rawProfit >= 0;
            const statusClass = isPositive ? "positive" : "negative";
            const sign = isPositive ? "+" : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <button data-stock-id="${stock.id}" class="sell-button">
                        <span class="stocks-left">${stock.symbol}</span>
                        <div class="stocks-right">
                            <span class="total-value">Value: ${formatPrice(stock.current_price * item.quantity)}</span>
                            <span class="profit ${statusClass}">${sign}${formatPrice(rawProfit)}</span>
                        </div>
                        <span class="stocks-left">Quantity: ${item.quantity}</span>
                        <span class="stocks-right">Current Price: ${formatPrice(stock.current_price)}</span>
                    </button>
                </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading portfolio:", error);
            tableBody.innerHTML = `<tr><td colspan="5">Error loading data.</td></tr>`;
            }
    }

    function getPortfolioValue() {
        let totalValue = 0;
        for (const stock of portfolioData) {
            const currentPrice = Number(stock.current_price) || 0;
            const quantity = Number(stock.quantity) || 0;
            totalValue += currentPrice * quantity;
        }
        return totalValue;
    }

    async function fetchStock(stockId) {
        try {
            const response = await fetch(`/api/stocks/${stockId}`);
            if(!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Failed to fetch stock:", err);
            return null;
        }
    }

    async function fetchPortfolio() {
        try {
            const response = await fetch("/api/user/portfolio");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const { portfolio, profitLoss } = await response.json();

            portfolioData = Array.isArray(portfolio) ? portfolio : [];

            const portfolioValue = getPortfolioValue();
            portfolioValueDisplay.textContent = formatPrice(portfolioValue);
            renderTable(portfolioData);
            displayProfitLoss(profitLoss);
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
        }
    }

    async function fetchBalance() {
        try {
            const response = await fetch('/api/user/balance');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            balanceDisplay.textContent = formatPrice(data.balance);
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    }

    async function addFunds() {
        const amountInput = document.getElementById("add-funds-input-modal").value;
        const amount = Number(amountInput);
        if (!Number.isFinite(amount) || amount <= 0) {
            fundsErrorModal.classList.remove("hidden");
            fundsErrorModal.textContent = "Please enter a valid amount.";
            return;
        }
        try {
            const res = await fetch("/api/user/addFunds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount })
            });
            if(!res.ok){
                throw new Error(`HTTP ${res.status}`);
            }
            closeAddFunds();
            await fetchBalance();
        } catch (err) {
            console.error("Failed to add funds");
            fundsErrorModal.classList.remove("hidden");
            fundsErrorModal.textContent = err?.message || "Failed to add funds.";
        }
    }

    function openModal(stock) {
        modalState.stockId = stock.stock_id;
        modalState.stockSymbol = stock.stock_symbol
        modalState.stockPrice = Number(stock.current_price) || 0;
        modalState.quantityOwned = Number(stock.quantity) || 0;
        modalState.averagePrice = stock.total_cost / stock.quantity || 0;
        modalState.profitLoss = (modalState.stock_price * modalState.quantityOwned) - (modalState.averagePrice * modalState.quantityOwned);

        balanceModal.textContent = formatPrice(Number(balanceDisplay.textContent) || 0);
        quantityOwnedModal.textContent = modalState.quantityOwned;
        averagePriceModal.textContent = formatPrice(modalState.averagePrice);
        currentPriceModal.textContent = formatPrice(modalState.stock_price);
        profitLossModal.textContent = formatPrice(modalState.profitLoss);
        quantityInputModal.value = "";
        errorModal.textContent = "";

        sellModal.classList.remove("hidden");
    }

    function closeModal() {
        fundsErrorModal.classList.add("hidden");
        errorModal.textContent = "";
        quantityInputModal.value = "";
        sellModal.classList.add("hidden");
    }

    async function openAddFunds() {
        await fetchBalance();
        currentBalance.textContent = balanceDisplay.textContent;
        addFundsModalOverlay.classList.remove("hidden");
    }

    function closeAddFunds(){
        addFundsModalOverlay.classList.add("hidden");
    }

    addFundsSubmit.addEventListener("click", addFunds);

    fundsModalClose.addEventListener("click", closeAddFunds);

    addFundsBtn.addEventListener("click", openAddFunds);


    closeBtnModal.addEventListener("click", () => {
        closeModal();
    });


    tableBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".sell-button");
        if (!btn) return;

        const stockId = btn.getAttribute("data-stock-id");
        const stock = portfolioData.find((s) => String(s.stock_id) === String(stockId));
        if (!stock) return;

        openModal(stock);
    });

    sellBtnModal.addEventListener("click", async () => {
        console.log("Sell button clicked");
        const quantityStr = quantityInputModal.value;
        const quantity = Number(quantityStr);
        const stockId = modalState.stockId;
        if (!quantityStr || !Number.isFinite(quantity) || quantity <= 0 || quantity > modalState.quantityOwned) {
            errorModal.classList.remove("hidden");
            errorModal.textContent = "Enter a valid quantity.";
            return;
        }

        try {
            const response = await fetch("/api/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stockId: stockId,
                    quantity: quantity
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            closeModal();
            await fetchPortfolio();
            await fetchBalance();
        } catch (err) {
            console.error("Failed to sell stock:", err);
            errorModal.classList.remove("hidden");
            errorModal.textContent = err?.message || "Failed to sell stock.";  
        }
    });

    setInterval(fetchPortfolio, 1000);

    fetchPortfolio();
    fetchBalance();
    renderDashboardData();
});
