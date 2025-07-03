// Constants
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['RELIANCE.NS', 'TATASTEEL.NS', 'HDFCBANK.NS', 'INFY.NS', 'TCS.NS'];

// App State
let state = {
  user: null,
  balance: 100000,
  holdings: {},
  trades: [],
  dematQueue: [],
  stocks: [],
  selectedStock: null,
  tradeType: 'buy'
};

// DOM Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const profileUsername = document.getElementById('profile-username');
const profileBalance = document.getElementById('profile-balance');
const availableBalance = document.getElementById('available-balance');
const stocksContainer = document.getElementById('stocks-container');

// Trade Modal
const tradeModal = document.getElementById('trade-modal');
const tradeSymbol = document.getElementById('trade-symbol');
const tradeName = document.getElementById('trade-name');
const tradePrice = document.getElementById('trade-price');
const quantityInput = document.getElementById('quantity');
const tradeTotal = document.getElementById('trade-total');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const tradeSubmit = document.getElementById('trade-submit');
const tradeClose = document.getElementById('trade-close');

// Init
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupNavigation();
  setupTradeModal();
  loadStocks();
  setInterval(loadStocks, 60000); // Refresh prices every 60s
});

// --- Login ---
function setupLogin() {
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const user = usernameInput.value.trim();
    if (!user) return;
    state.user = user;
    loadSession();
    updateUI();
    authScreen.style.display = 'none';
    appContainer.style.display = 'block';
  };
}

function updateUI() {
  profileUsername.textContent = state.user;
  profileBalance.textContent = `₹${state.balance.toFixed(2)}`;
  availableBalance.textContent = `₹${state.balance.toFixed(2)}`;
}

function loadSession() {
  const saved = localStorage.getItem(`trademock_${state.user}`);
  if (saved) {
    const data = JSON.parse(saved);
    state.balance = data.balance || 100000;
    state.holdings = data.holdings || {};
    state.trades = data.trades || [];
    state.dematQueue = data.dematQueue || [];
  }
}

function saveSession() {
  if (!state.user) return;
  localStorage.setItem(`trademock_${state.user}`, JSON.stringify({
    balance: state.balance,
    holdings: state.holdings,
    trades: state.trades,
    dematQueue: state.dematQueue
  }));
}

// --- Navigation ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const mobileItems = document.querySelectorAll('.mobile-nav-btn');
  const contentSections = document.querySelectorAll('.content-section');

  function showSection(id) {
    contentSections.forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`${id}-section`).classList.remove('hidden');
    document.getElementById('section-title').textContent = id.charAt(0).toUpperCase() + id.slice(1);
  }

  navItems.forEach(item => {
    item.onclick = () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showSection(item.dataset.section);
    };
  });

  mobileItems.forEach(item => {
    item.onclick = () => {
      mobileItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showSection(item.dataset.section);
    };
  });

  logoutBtn.onclick = () => {
    saveSession();
    state.user = null;
    appContainer.style.display = 'none';
    authScreen.style.display = 'flex';
  };
}

// --- Stock Fetch & Render ---
async function loadStocks() {
  try {
    const symbols = DEFAULT_SYMBOLS.join(',');
    const quoteRes = await fetch(`${BASE_URL}/quote?symbol=${symbols}&apikey=${API_KEY}`);
    const quoteData = await quoteRes.json();

    state.stocks = DEFAULT_SYMBOLS.map(symbol => {
      const info = quoteData[symbol] || {};
      return {
        symbol: symbol.replace('.NS', ''),
        name: info.name || symbol,
        price: parseFloat(info.price || 0),
        change: parseFloat(info.change || 0),
        changePercent: parseFloat(info.percent_change || 0)
      };
    });

    renderStocks();
  } catch (err) {
    console.error('Error loading stocks:', err);
  }
}

function renderStocks() {
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
        <div>
          <div class="stock-price">₹${stock.price.toFixed(2)}</div>
          <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
            ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      <div class="stock-actions">
        <button class="stock-btn buy">Buy</button>
        <button class="stock-btn sell">Sell</button>
      </div>
    `;
    card.querySelector('.buy').onclick = () => openTradeModal(stock, 'buy');
    card.querySelector('.sell').onclick = () => openTradeModal(stock, 'sell');
    stocksContainer.appendChild(card);
  });
}

// --- Trade Modal ---
function setupTradeModal() {
  tradeClose.onclick = () => tradeModal.classList.remove('show');

  buyBtn.onclick = () => setTradeType('buy');
  sellBtn.onclick = () => setTradeType('sell');

  quantityInput.oninput = updateTradeSummary;

  tradeSubmit.onclick = executeTrade;
}

function openTradeModal(stock, type) {
  state.selectedStock = stock;
  state.tradeType = type;
  tradeSymbol.textContent = stock.symbol;
  tradeName.textContent = stock.name;
  tradePrice.textContent = `₹${stock.price.toFixed(2)}`;
  quantityInput.value = '';
  updateTradeSummary();
  setTradeType(type);
  tradeModal.classList.add('show');
}

function setTradeType(type) {
  state.tradeType = type;
  buyBtn.classList.toggle('active', type === 'buy');
  sellBtn.classList.toggle('active', type === 'sell');
}

function updateTradeSummary() {
  const qty = parseInt(quantityInput.value || '0', 10);
  const total = qty * (state.selectedStock?.price || 0);
  tradeTotal.textContent = `₹${total.toFixed(2)}`;
}

function executeTrade() {
  const qty = parseInt(quantityInput.value || '0', 10);
  const stock = state.selectedStock;
  const total = qty * stock.price;
  if (qty <= 0 || !stock) return;

  if (state.tradeType === 'buy') {
    if (total > state.balance) {
      alert('Insufficient balance');
      return;
    }
    state.balance -= total;
    state.holdings[stock.symbol] = (state.holdings[stock.symbol] || 0) + qty;
    state.trades.push({ ...stock, qty, type: 'buy', date: new Date().toISOString() });
  } else {
    const currentQty = state.holdings[stock.symbol] || 0;
    if (qty > currentQty) {
      alert('Not enough shares to sell');
      return;
    }
    state.balance += total;
    state.holdings[stock.symbol] = currentQty - qty;
    state.trades.push({ ...stock, qty, type: 'sell', date: new Date().toISOString() });
  }

  updateUI();
  saveSession();
  tradeModal.classList.remove('show');
}