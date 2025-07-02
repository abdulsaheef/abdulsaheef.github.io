const defaultBalance = 100000;
let state = {
  user: null,
  balance: 0,
  holdings: {},
  dematQueue: [],
  trades: [],
  stocks: []
};

// ✅ LIVE: Fetch NSE stocks from TwelveData (batch endpoint)
async function loadStocks() {
  const symbols = ["INFY.NS", "TCS.NS", "RELIANCE.NS", "HDFCBANK.NS", "ICICIBANK.NS"];
  const apiKey = "8aabf877b0ec41bd87662871378e0ef4";
  const url = `https://api.twelvedata.com/quote?symbol=${symbols.join(",")}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    state.stocks = symbols.map(sym => {
      const quote = data[sym];
      return {
        symbol: sym.replace(".NS", ""),
        name: quote.name || sym,
        price: parseFloat(quote.price)
      };
    });
    console.log("✅ Live stock data loaded:", state.stocks);
  } catch (err) {
    console.error("❌ Error fetching stock data:", err);
    alert("Stock fetch failed. Try again later.");
  }
}

// 🔐 LOGIN SYSTEM
function setupLogin() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');

  document.getElementById('login-btn').onclick = () => {
    const uname = document.getElementById('login-username').value.trim();
    if (!uname) return alert("Enter username");
    state.user = uname;
    loadSession();
    loginScreen.style.display = "none";
    app.classList.remove("hidden");
    updateUI();
  };
}

function loadSession() {
  const key = `trademock_${state.user}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  } else {
    state.balance = defaultBalance;
    state.holdings = {};
    state.dematQueue = [];
    state.trades = [];
    saveSession();
  }
}

function saveSession() {
  const key = `trademock_${state.user}`;
  localStorage.setItem(key, JSON.stringify(state));
}

// 🔁 NAVIGATION HANDLING
function setupNav() {
  const buttons = document.querySelectorAll('.bottom-nav button');
  const pages = document.querySelectorAll('.page');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      pages.forEach(p => p.classList.remove('active'));
      document.getElementById(btn.dataset.target).classList.add('active');
      updateUI();
    });
  });
}

// 📈 MARKET RENDER
function renderMarket() {
  const ul = document.getElementById('market-list');
  ul.innerHTML = '';
  state.stocks.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="stock-item">
        <strong>${s.symbol}</strong> - ₹${s.price}
        <button onclick="openTrade('${s.symbol}')">Trade</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// 💰 PORTFOLIO RENDER
function renderPortfolio() {
  const ul = document.getElementById('portfolio-list');
  ul.innerHTML = '';
  for (let sym in state.holdings) {
    const h = state.holdings[sym];
    const cur = state.stocks.find(s => s.symbol === sym)?.price || 0;
    const pnl = ((cur - h.avgPrice) * h.qty).toFixed(2);
    const li = document.createElement('li');
    li.innerHTML = `<strong>${sym}</strong>: ${h.qty} @ ₹${h.avgPrice.toFixed(2)} → ₹${cur} (P&L ₹${pnl})`;
    ul.appendChild(li);
  }
}

// 🧾 TRADE HISTORY
function renderHistory() {
  const ul = document.getElementById('trade-history');
  ul.innerHTML = '';
  state.trades.slice().reverse().forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${new Date(t.time).toLocaleString()}: ${t.qty > 0 ? 'BUY' : 'SELL'} ${t.symbol} @ ₹${t.price}`;
    ul.appendChild(li);
  });
}

// 📦 DEMAT STATEMENT
function renderDemat() {
  const ul = document.getElementById('demat-statement');
  ul.innerHTML = '';
  state.dematQueue.forEach(d => {
    const li = document.createElement('li');
    li.textContent = `${d.symbol}: +${d.qty} shares (T+2: ${d.settleDate})`;
    ul.appendChild(li);
  });
}

// 🎯 MAIN UI REFRESH
function updateUI() {
  document.getElementById('balance').innerText = state.balance.toFixed(2);
  document.getElementById('invested').innerText =
    Object.values(state.holdings).reduce((sum, h) => sum + h.qty * h.avgPrice, 0).toFixed(2);

  renderMarket();
  renderPortfolio();
  renderHistory();
  renderDemat();
}

// 🔁 T+2 DEMAT SETTLEMENT
function processSettlement() {
  const today = new Date().toISOString().split('T')[0];
  state.dematQueue = state.dematQueue.filter(d => d.settleDate > today);
  saveSession();
}

// 🛒 TRADE EXECUTION
function openTrade(symbol) {
  const price = state.stocks.find(s => s.symbol === symbol).price;
  const qty = parseInt(prompt(`Enter qty to BUY (+) or SELL (-)\nPrice: ₹${price}`));
  if (!qty) return;

  const cost = qty * price;
  const holding = state.holdings[symbol] || { qty: 0, avgPrice: 0 };

  if (qty < 0 && holding.qty + qty < 0) return alert("Not enough shares to sell");
  if (qty > 0 && cost > state.balance) return alert("Not enough balance");

  // Update balance and holdings
  state.balance -= cost;
  const newQty = holding.qty + qty;
  const newAvg = qty > 0 ? ((holding.avgPrice * holding.qty + price * qty) / newQty) : holding.avgPrice;

  if (newQty <= 0) delete state.holdings[symbol];
  else state.holdings[symbol] = { qty: newQty, avgPrice: newAvg };

  // Add to demat queue if buy
  if (qty > 0) {
    state.dematQueue.push({
      symbol, qty, price,
      buyDate: new Date().toISOString().split('T')[0],
      settleDate: getTplus2()
    });
  }

  state.trades.push({ symbol, price, qty, time: new Date().toISOString() });
  saveSession();
  updateUI();
}

function getTplus2() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
}

// 🚀 INIT
window.onload = async () => {
  await loadStocks();
  setupLogin();
  setupNav();
  processSettlement();
  updateUI();

  // 🔁 Refresh live prices every minute
  setInterval(async () => {
    await loadStocks();
    updateUI();
  }, 60000);
};