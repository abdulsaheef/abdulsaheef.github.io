const defaultBalance = 100000;
let state = {
  user: null,
  balance: 0,
  holdings: {},
  dematQueue: [],
  trades: [],
  stocks: []
};

// ✅ Load Live Stocks via TwelveData API
async function loadStocks() {
  const symbols = ["INFY.NS", "TCS.NS", "RELIANCE.NS", "HDFCBANK.NS", "ICICIBANK.NS"];
  const apiKey = "8aabf877b0ec41bd87662871378e0ef4";

  const requests = symbols.map(sym =>
    fetch(`https://api.twelvedata.com/price?symbol=${sym}&apikey=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.price) {
          return {
            symbol: sym.replace(".NS", ""),
            name: sym,
            price: parseFloat(data.price)
          };
        } else {
          console.warn(`❌ Failed for ${sym}`, data);
          return null;
        }
      }).catch(err => {
        console.error(`⚠️ Error fetching ${sym}:`, err);
        return null;
      })
  );

  const results = await Promise.all(requests);
  state.stocks = results.filter(item => item !== null);
}

// 🔐 Login Setup
function setupLogin() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');

  document.getElementById('login-btn').onclick = () => {
    const uname = document.getElementById('login-username').value.trim();
    if (!uname) return alert('Enter username');

    state.user = uname;
    loadSession();

    // ✅ HIDE LOGIN SCREEN
    loginScreen.style.display = 'none';

    // ✅ SHOW MAIN APP
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

// 📱 Bottom Navigation SPA
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

// 📊 Update All Views
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

// 📈 Market View
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

// 🔁 Trade Execution Panel
function openTrade(symbol) {
  const price = state.stocks.find(s=>s.symbol===symbol).price;
  const qty = prompt(`Price ₹${price}\nEnter qty to BUY (positive) or SELL (negative):`);
  const q = parseInt(qty);
  if (!q) return;
  executeTrade(symbol, price, q);
}

function executeTrade(symbol, price, qty) {
  const cost = price * qty;
  if (qty < 0) {
    const holding = state.holdings[symbol] || { qty:0, avgPrice:0 };
    if (holding.qty + qty < 0) return alert('Not enough shares');
  }
  if (qty > 0 && cost > state.balance) return alert('Insufficient cash');
  state.balance -= cost;
  const h = state.holdings[symbol] || { qty:0, avgPrice:0 };
  const newQty = h.qty + qty;
  const newAvg = qty>0
    ? ((h.avgPrice*h.qty + price*qty)/(h.qty+qty))
    : h.avgPrice;
  if (newQty===0) delete state.holdings[symbol];
  else state.holdings[symbol] = { qty: newQty, avgPrice: newAvg };
  if (qty>0) {
    state.dematQueue.push({
      symbol, qty, price,
      buyDate: new Date().toISOString().split('T')[0],
      settleDate: settlementDate(2)
    });
  }
  state.trades.push({ symbol, price, qty, time: new Date().toISOString() });
  saveSession();
  updateUI();
}

function settlementDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function processSettlement() {
  const today = new Date().toISOString().split('T')[0];
  state.dematQueue = state.dematQueue.filter(item => {
    if (item.settleDate <= today) return false;
    return true;
  });
  saveSession();
}

// 💼 Portfolio View
function renderPortfolio() {
  const ul = document.getElementById('portfolio-list');
  ul.innerHTML = '';
  for (let sym in state.holdings) {
    const h = state.holdings[sym];
    const cur = state.stocks.find(s=>s.symbol===sym)?.price || 0;
    const pnl = ((cur - h.avgPrice) * h.qty).toFixed(2);
    const li = document.createElement('li');
    li.textContent = `${sym}: ${h.qty} @ ₹${h.avgPrice.toFixed(2)} → ₹${cur} (P&L: ₹${pnl})`;
    ul.append(li);
  }
}

// 📃 Demat T+2 View
function renderDemat() {
  const ul = document.getElementById('demat-statement');
  ul.innerHTML = '';
  state.dematQueue.forEach(it => {
    const li = document.createElement('li');
    li.textContent = `${it.symbol}: +${it.qty} shares (T+2 → ${it.settleDate})`;
    ul.append(li);
  });
}

// 🧾 History View
function renderHistory() {
  const ul = document.getElementById('trade-history');
  ul.innerHTML = '';
  state.trades.slice().reverse().forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${new Date(t.time).toLocaleString()}: ${t.qty>0?'BUY':'SELL'} ${t.symbol} @ ₹${t.price} × ${Math.abs(t.qty)}`;
    ul.append(li);
  });
}

// 🟢 Init App
window.onload = async () => {
  await loadStocks();
  setupLogin();
  setupNav();
  updateUI();
  processSettlement();

  // 🔁 Auto-refresh market every 60 seconds
  setInterval(async () => {
    await loadStocks();
    updateUI();
    console.log("📈 Market prices updated.");
  }, 60000);
};

