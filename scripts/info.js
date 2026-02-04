document.addEventListener("DOMContentLoaded", () => {
    const displayBalance = document.getElementById("user-balance");
    const displayPortfolioValue = document.getElementById("portfolio-value");
    const displayProfitLoss = document.getElementById("profit-loss");

    async function renderData() {
        try {
            const balanceData = await userBalance();
            const profitLossData = await profitLoss();
            displayBalance.textContent = balanceData.balance;

            const totalValueData = await portfolioValue();
            const profitLossValue = profitLossData.profitLoss;

            displayProfitLoss.textContent = profitLossValue.toFixed(2);
            displayPortfolioValue.textContent = totalValueData.portfolioValue.toFixed(2);
        } catch (err) {
            console.error("Failed to fetch user info:", err);
            displayBalance.textContent = "Error loading data.";
            displayPortfolioValue.textContent = "Error loading data.";
            displayProfitLoss.textContent = "Error loading data.";
        }
    }

    async function userBalance(){
        try{
            const res = await fetch("/api/user/balance");
            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data;
        } catch(err){
            console.error("Failed to fetch user balance:", err);
            return null;
        }
    }

    async function portfolioValue(){
        try{
            const res = await fetch("/api/user/portfolioValue");
            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data;
        } catch(err){
            console.error("Failed to fetch portfolio value:", err);
            return null;
        }
    }

    async function profitLoss(){
        try{
            const res = await fetch("/api/user/profitLoss");
            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data;
        } catch(err){
            console.error("Failed to fetch profit/loss:", err);
            return null;
        }
    }

    renderData();
});
