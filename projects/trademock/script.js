// —————————————————————————————
// TradeMock v0.1
// —————————————————————————————
const defaultBalance = 100000;
let state = {
  user: null,
  balance: 0,
  holdings: {},    // { symbol: { qty, avgPrice } }
  dematQueue: [],  // unsettled T+2 trades
  trades: [],      // history
  stocks: []       // market data
};

// —————————————————————————————
// Initialization
// —————————————————————————————
window.onload = async () => {
  await loadStocks();
  setupLogin();
  setupNav();
  updateUI();
  processSettlement();
};

// Load mock stocks
async function loadStocks() {
  const res = await fetch('data/mock-stocks.json');
  state.stocks = await res.json();
}

// —————————————————————————————
// Local Login System
// —————————————————————————————
function setupLogin() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  document.getElementById('login-btn').onclick = () => {
    const uname = document.getElementById('login-username').value.trim();
    if (!uname) return alert('Enter username');
    state.user = uname;
    loadSession();
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
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

// —————————————————————————————
// SPA Navigation
// —————————————————————————————
function setupNav() {
  document.querySelectorAll('.bottom-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tgt = btn.dataset.target;
      document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === tgt);
      });
      if (tgt === 'market') renderMarket();
      if (tgt === 'portfolio') renderPortfolio();
      if (tgt === 'demat') renderDemat();
      if (tgt === 'history') renderHistory();
    });
  });
}

// —————————————————————————————
// UI Updates
// —————————————————————————————
function updateUI() {
  document.getElementById('balance').innerText = state.balance.toFixed(2);
  document.getElementById('invested').innerText = 
    Object.values(state.holdings)
      .reduce((sum,h)=> sum + h.qty * h.avgPrice, 0).toFixed(2);
  renderMarket();
  renderPortfolio();
  renderDemat();
  renderHistory();
}

// —————————————————————————————
// Render Market View
// —————————————————————————————
function renderMarket() {
  const ul = document.getElementById('market-list');
  ul.innerHTML = '';
  state.stocks.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${s.symbol} - ₹${s.price}</span>
      <button onclick="openTrade('${s.symbol}')">Trade</button>
    `;
    ul.append(li);
  });
}

// —————————————————————————————
// Open Buy/Sell Panel
// —————————————————————————————
function openTrade(symbol) {
  const price = state.stocks.find(s=>s.symbol===symbol).price;
  const qty = prompt(`Price ₹${price}\nEnter qty to BUY (positive) or SELL (negative):`);
  const q = parseInt(qty);
  if (!q) return;
  executeTrade(symbol, price, q);
}

// —————————————————————————————
// Execute Trade
// —————————————————————————————
function executeTrade(symbol, price, qty) {
  const cost = price * qty;
  // Selling
  if (qty < 0) {
    const holding = state.holdings[symbol] || { qty:0, avgPrice:0 };
    if (holding.qty + qty < 0) return alert('Not enough shares');
  }
  // Buying: check balance
  if (qty > 0 && cost > state.balance) return alert('Insufficient cash');
  // Deduct/Add balance
  state.balance -= cost;
  // Update holdings
  const h = state.holdings[symbol] || { qty:0, avgPrice:0 };
  const newQty = h.qty + qty;
  const newAvg = qty>0
    ? ((h.avgPrice*h.qty + price*qty)/(h.qty+qty))
    : h.avgPrice;
  if (newQty===0) delete state.holdings[symbol];
  else state.holdings[symbol] = { qty: newQty, avgPrice: newAvg };
  // T+2 settlement for buys
  if (qty>0) {
    state.dematQueue.push({
      symbol, qty, price,
      buyDate: new Date().toISOString().split('T')[0],
      settleDate: settlementDate(2)
    });
  }
  // Log trade
  state.trades.push({ symbol, price, qty, time: new Date().toISOString() });
  saveSession();
  updateUI();
}

// —————————————————————————————
// Settlement Logic (T+2)
// —————————————————————————————
function settlementDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function processSettlement() {
  const today = new Date().toISOString().split('T')[0];
  state.dematQueue = state.dematQueue.filter(item => {
    if (item.settleDate <= today) {
      // move to holdings (already added avg/qty in executeTrade)
      return false;
    }
    return true;
  });
  saveSession();
}

// —————————————————————————————
// Render Portfolio
// —————————————————————————————
function renderPortfolio() {
  const ul = document.getElementById('portfolio-list');
  ul.innerHTML = '';
  for (let sym in state.holdings) {
    const h = state.holdings[sym];
    const cur = state.stocks.find(s=>s.symbol===sym).price;
    const pnl = ((cur - h.avgPrice) * h.qty).toFixed(2);
    const li = document.createElement('li');
    li.innerHTML = `${sym}: ${h.qty} @ ₹${h.avgPrice.toFixed(2)} → ₹${cur} (${pnl})`;
    ul.append(li);
  }
}

// —————————————————————————————
// Render Demat Statement
// —————————————————————————————
function renderDemat() {
  const ul = document.getElementById('demat-statement');
  ul.innerHTML = '';
  state.dematQueue.forEach(it => {
    const li = document.createElement('li');
    li.textContent = `${it.symbol}: +${it.qty} shares on T+2 (${it.settleDate})`;
    ul.append(li);
  });
}

// —————————————————————————————
// Render Trade History
// —————————————————————————————
function renderHistory() {
  const ul = document.getElementById('trade-history');
  ul.innerHTML = '';
  state.trades.slice().reverse().forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${new Date(t.time).toLocaleString()}: ${t.qty>0?'BUY':'SELL'} ${t.symbol} @ ₹${t.price} × ${Math.abs(t.qty)}`;
    ul.append(li);
  });
}