// --- Config ---
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const SYMBOLS = ['RELIANCE.NS', 'TATASTEEL.NS', 'HDFCBANK.NS', 'INFY.NS', 'TCS.NS'];

// --- App State ---
let state = {
  user: null,
  balance: 100000,
  holdings: {},
  trades: [],
  dematQueue: [],
  stocks: []
};

// --- DOM Elements ---
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  if (!username) return;

  state.user = username;
  loadSession();
  updateProfileUI();

  // Show app
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
});
const usernameInput = document.getElementById('username');
const profileUsername = document.getElementById('profile-username');
const profileBalance = document.getElementById('profile-balance');
const availableBalance = document.getElementById('available-balance');
const logoutBtn = document.getElementById('logout-btn');
const stocksContainer = document.getElementById('stocks-container');

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupNavigation();
  setupTradeModal();
  loadStocks();
  setInterval(loadStocks, 60000);
});

// --- Login ---
function setupLogin() {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;
    state.user = username;
    loadSession();
    updateProfileUI();
    authScreen.style.display = 'none';
    appContainer.style.display = 'block';
  });
}

function updateProfileUI() {
  profileUsername.textContent = state.user;
  profileBalance.textContent = state.balance.toFixed(2);
  availableBalance.textContent = state.balance.toFixed(2);
}

function loadSession() {
  const saved = localStorage.getItem(`trademock_${state.user}`);
  if (saved) {
    const data = JSON.parse(saved);
    state.balance = data.balance;
    state.holdings = data.holdings || {};
    state.dematQueue = data.dematQueue || [];
    state.trades = data.trades || [];
  }
}

function saveSession() {
  localStorage.setItem(`trademock_${state.user}`, JSON.stringify({
    balance: state.balance,
    holdings: state.holdings,
    dematQueue: state.dematQueue,
    trades: state.trades
  }));
}

// --- Navigation ---
function setupNavigation() {
  document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
      document.getElementById(`${section}-section`).classList.remove('hidden');
      document.getElementById('section-title').textContent = section.charAt(0).toUpperCase() + section.slice(1);
      document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(i => i.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  logoutBtn.addEventListener('click', () => {
    saveSession();
    appContainer.style.display = 'none';
    authScreen.style.display = 'flex';
  });
}

// --- Stock Loading ---
async function loadStocks() {
  try {
    const symbols = SYMBOLS.join(',');
    const priceRes = await fetch(`${BASE_URL}/price?symbol=${symbols}&apikey=${API_KEY}`);
    const quoteRes = await fetch(`${BASE_URL}/quote?symbol=${symbols}&apikey=${API_KEY}`);
    const prices = await priceRes.json();
    const quotes = await quoteRes.json();

    state.stocks = SYMBOLS.map(symbol => {
      const base = symbol.replace('.NS', '');
      const q = quotes[symbol];
      return {
        symbol: base,
        name: q.name || base,
        price: parseFloat(prices[symbol]?.price || 0),
        change: parseFloat(q?.change || 0),
        percent: parseFloat(q?.percent_change || 0)
      };
    });

    renderMarket();
  } catch (err) {
    console.error('Stock fetch failed:', err);
  }
}

function renderMarket() {
  stocksContainer.innerHTML = '';
  state.stocks.forEach(stock => {
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.innerHTML = `
      <div class="stock-header">
        <div>
          <div class="stock-name">${stock.name}</div>
          <div class="stock-symbol">${stock.symbol}</div>
        </div>
        <div class="stock-price">₹${stock.price.toFixed(2)}</div>
      </div>
      <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.percent.toFixed(2)}%)
      </div>
      <div class="stock-actions">
        <button class="stock-btn buy" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price})">Buy</button>
      </div>
    `;
    stocksContainer.appendChild(card);
  });
}

// --- Trade Modal ---
const modal = document.getElementById('trade-modal');
const closeModalBtn = document.getElementById('close-modal');
const tradeSymbolInput = document.getElementById('trade-symbol');
const tradeQuantityInput = document.getElementById('trade-quantity');
const tradeConfirmBtn = document.getElementById('trade-confirm-btn');

function setupTradeModal() {
  closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
  tradeConfirmBtn.addEventListener('click', () => {
    const symbol = tradeSymbolInput.value;
    const qty = parseInt(tradeQuantityInput.value);
    if (!symbol || qty <= 0) return;
    const stock = state.stocks.find(s => s.symbol === symbol);
    const cost = stock.price * qty;
    if (state.balance < cost) return alert('Insufficient balance');
    // Deduct and add to holdings
    state.balance -= cost;
    state.holdings[symbol] = (state.holdings[symbol] || 0) + qty;
    state.trades.push({ type: 'buy', symbol, qty, price: stock.price, time: new Date().toISOString() });
    updateProfileUI();
    saveSession();
    modal.classList.remove('show');
    alert(`Bought ${qty} shares of ${symbol}`);
  });
}

function openTradeModal(symbol, name, price) {
  tradeSymbolInput.value = symbol;
  tradeQuantityInput.value = 1;
  modal.classList.add('show');
}

