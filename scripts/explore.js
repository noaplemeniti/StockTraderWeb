document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#stocks-table tbody");
  const searchInput = document.getElementById("search-input");

  const cancelBuyBtn = document.getElementById("cancel-buy");
  const buyModalElement = document.getElementById("buy-modal");
  const stockSymbolElement = document.getElementById("stock-symbol");
  const stockPriceElement = document.getElementById("stock-price");
  const quantityInput = document.getElementById("quantity-input");
  const balanceAmountElement = document.getElementById("balance-amount");
  const totalCostElement = document.getElementById("total-cost");
  const buyErrorElement = document.getElementById("buy-error");
  const confirmBuyBtn = document.getElementById("confirm-buy");

  if(!tableBody) console.error("Table body not found");
  if(!cancelBuyBtn) console.error("Cancel buy button not found");
  if(!buyModalElement) console.error("Buy modal element not found");
  if(!stockSymbolElement) console.error("Stock symbol element not found");
  if(!stockPriceElement) console.error("Stock price element not found");
  if(!quantityInput) console.error("Quantity input not found");
  if(!balanceAmountElement) console.error("Balance amount element not found");
  if(!totalCostElement) console.error("Total cost element not found");
  if(!buyErrorElement) console.error("Buy error element not found");
  if(!confirmBuyBtn) console.error("Confirm buy button not found");

  let allStocks = [];
  let filteredStocks = [];
  
  let modalState = {
    stockId: null,
    stockSymbol: null,
    price: 0,
    balance: 0
  };

  function formatPrice(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return `${num.toFixed(2)}`;
  }

  function renderTable(stocks) {
    tableBody.innerHTML = "";

    if (stocks.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3">No stocks found.</td></tr>`;
      return;
    }

    for (const stock of stocks) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <button data-stock-id="${stock.id}" class="buy-button"><span class="stocks-left">${stock.company_name}</span>
        <span class="stocks-right">${stock.symbol}</span>
        <span class="stocks-left">Current Price: ${formatPrice(stock.current_price)}</span>
        <span class="stocks-right">Volatility: ${stock.volatility}</span>
        </button>
      `;

      tableBody.appendChild(row);
    }
  }

  function applySearch() {
    const term = (searchInput.value || "").trim().toLowerCase();

    if (!term) {
      filteredStocks = allStocks;
    } else {
      filteredStocks = allStocks.filter((s) => {
        const symbol = String(s.symbol || "").toLowerCase();
        const name = String(s.company_name || "").toLowerCase();
        return symbol.includes(term) || name.includes(term);
      });
    }

    renderTable(filteredStocks);
  }

  async function fetchStocks() {
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      allStocks = await res.json();
      applySearch();
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
      tableBody.innerHTML = `<tr><td colspan="3">Failed to load stocks.</td></tr>`;
    }
  }

  async function openModal(stock){
      modalState.stockId = stock.id;
      modalState.price = Number(stock.current_price) || 0;
      modalState.stockSymbol = stock.symbol;

      stockSymbolElement.textContent = modalState.stockSymbol;
      stockPriceElement.textContent = formatPrice(modalState.price);


      quantityInput.value = "0";
      totalCostElement.textContent = "0.00";
      showBuyError("");

      try{
        const res = await fetch("/api/user/balance");
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const balance = Number(data.balance) || 0;
        balanceAmountElement.textContent = formatPrice(balance);
        modalState.balance = balance;
      } catch(err){
        console.error("Failed to fetch balance:", err);
        balanceAmountElement.textContent = "-";
      }

      buyModalElement.classList.remove("hidden");
  }
    
  function closeModal() {
      buyModalElement.classList.add("hidden");
  }

  confirmBuyBtn.addEventListener("click", async () => {
      const qty = Number(quantityInput.value) || 0;
      const totalCost = qty * modalState.price;

      if (qty <= 0) {
        showBuyError("Quantity must be greater than 0.");
        return;
      }

      if (totalCost > modalState.balance) {
        showBuyError("Insufficient balance.");
        return;
      }

      try {
        const res = await fetch("/api/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockId: modalState.stockId,
            stockSymbol: modalState.stockSymbol,
            quantity: qty
          })
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          showBuyError(error.error || error.details || "Purchase failed.");
          return;
        }

        closeModal();
        fetchStocks();
      } catch (err) {
          console.error("BUY ERROR:", err);
          showBuyError("Purchase failed.");
}
  });

  searchInput.addEventListener("input", applySearch);

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".buy-button");
    if (!btn) return;

    const stockId = Number(btn.dataset.stockId);
    const stock = allStocks.find(s => Number(s.id) === stockId);
    if (!stock) return;

    openModal(stock);
  });

  cancelBuyBtn.addEventListener("click", closeModal);
  quantityInput.addEventListener("input", () => {
    const qty = Number(quantityInput.value) || 0;
    const totalCost = qty * modalState.price;
    totalCostElement.textContent = totalCost.toFixed(2);
    showBuyError("");
  });

  function showBuyError(msg) {
  buyErrorElement.textContent = msg || "";
  buyErrorElement.classList.toggle("hidden", !msg);
}

  fetchStocks();
});
