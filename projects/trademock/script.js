// ========== CONFIGURATION ==========
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];

// ========== APP STATE ==========
let state = {
  user: null,
  balance: 100000,
  holdings: {},
  dematQueue: [],
  trades: [],
  stocks: []
};

// ========== DOM REFERENCES ==========
const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app-container');
const profileUsername = document.getElementById('profile-username');
const profileBalance = document.getElementById('profile-balance');
const availableBalance = document.getElementById('available-balance');
const logoutBtn = document.getElementById('logout-btn');

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupNavigation();
  setupTradeModal();
  loadStocks();
  setInterval(loadStocks, 60000); // refresh every minute
});

// ========== LOGIN ==========
function setupLogin() {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (!username) return;

    state.user = username;
    loadSession();

    profileUsername.textContent = username;
    profileBalance.textContent = state.balance.toFixed(2);
    availableBalance.textContent = state.balance.toFixed(2);

    document.getElementById('auth-screen').style.display = 'none';
    appContainer.style.display = 'block';
  });
}

function loadSession() {
  const data = localStorage.getItem(`trademock_${state.user}`);
  if (data) {
    const parsed = JSON.parse(data);
    state.balance = parsed.balance || 100000;
    state.holdings = parsed.holdings || {};
    state.dematQueue = parsed.dematQueue || [];
    state.trades = parsed.trades || [];
  }
}

function saveSession() {
  localStorage.setItem(
    `trademock_${state.user}`,
    JSON.stringify({
      balance: state.balance,
      holdings: state.holdings,
      dematQueue: state.dematQueue,
      trades: state.trades
    })
  );
}

// ========== NAVIGATION ==========
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
  const dematTabs = document.querySelectorAll('.demat-tab');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showSection(item.dataset.section);
      updateMobileNav(item.dataset.section);
    });
  });

  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mobileNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showSection(btn.dataset.section);
      updateDesktopNav(btn.dataset.section);
    });
  });

  dematTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dematTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.demat-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`demat-${tab.dataset.tab}`).classList.remove('hidden');
    });
  });

  logoutBtn.addEventListener('click', () => {
    document.getElementById('auth-screen').style.display = 'flex';
    appContainer.style.display = 'none';
  });
}

function showSection(section) {
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.add('hidden');
  });
  document.getElementById(`${section}-section`).classList.remove('hidden');
  document.getElementById('section-title').textContent = 
    section.charAt(0).toUpperCase() + section.slice(1);
}

function updateMobileNav(section) {
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
}

function updateDesktopNav(section) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });
}

// ========== STOCK LOADING ==========
async function loadStocks() {
  try {
    const symbols = DEFAULT_SYMBOLS.join(',');
    const priceRes = await fetch(`${BASE_URL}/price?symbol=${symbols}&apikey=${API_KEY}`);
    const quoteRes = await fetch(`${BASE_URL}/quote?symbol=${symbols}&apikey=${API_KEY}`);

    const priceData = await priceRes.json();
    const quoteData = await quoteRes.json();

    state.stocks = DEFAULT_SYMBOLS.map(symbol => {
      const base = symbol.replace('.NS', '');
      const quote = quoteData[symbol] || {};
      return {
        symbol: base,
        name: quote.name || base,
        price: parseFloat(priceData[symbol]?.price || 0),
        change: parseFloat(quote.change || 0),
        changePercent: parseFloat(quote.percent_change || 0)
      };
    });

    updateMarket();
    updatePortfolioValues();
  } catch (err) {
    console.error('Stock fetch failed:', err);
  }
}

function updateMarket() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '';

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
        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} 
        (${stock.changePercent.toFixed(2)}%)
      </div>
      <div class="stock-actions">
        <button class="stock-btn buy" onclick="openTradeModal('${stock.symbol}', 'buy')">Buy</button>
        <button class="stock-btn sell" onclick="openTradeModal('${stock.symbol}', 'sell')">Sell</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ========== TRADE MODAL ==========
function setupTradeModal() {
  const modal = document.getElementById('trade-modal');
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('trade-submit').addEventListener('click', handleTradeSubmit);

  const typeBtns = document.querySelectorAll('.trade-type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('trade-qty').addEventListener('input', updateTradeSummary);
  document.getElementById('trade-price').addEventListener('input', updateTradeSummary);
}

let currentTrade = { symbol: '', action: 'buy', price: 0 };

function openTradeModal(symbol, action) {
  const stock = state.stocks.find(s => s.symbol === symbol);
  if (!stock) return;

  currentTrade = { symbol, action, price: stock.price };
  document.getElementById('trade-stock-symbol').textContent = stock.symbol;
  document.getElementById('trade-stock-name').textContent = stock.name;
  document.getElementById('trade-stock-price').textContent = `₹${stock.price.toFixed(2)}`;
  document.getElementById('trade-qty').value = 1;
  document.getElementById('trade-price').value = stock.price.toFixed(2);

  updateTradeSummary();
  document.getElementById('trade-modal').classList.remove('hidden');

  document.querySelectorAll('.trade-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === action);
  });
}

function updateTradeSummary() {
  const qty = parseInt(document.getElementById('trade-qty').value || 1);
  const price = parseFloat(document.getElementById('trade-price').value || 0);
  const amount = qty * price;
  const brokerage = amount * 0.001;
  const net = amount + brokerage;

  document.getElementById('trade-total').textContent = `₹${amount.toFixed(2)}`;
  document.getElementById('trade-brokerage').textContent = `₹${brokerage.toFixed(2)}`;
  document.getElementById('trade-net').textContent = `₹${net.toFixed(2)}`;
}

function handleTradeSubmit() {
  const qty = parseInt(document.getElementById('trade-qty').value);
  const price = parseFloat(document.getElementById('trade-price').value);
  const total = qty * price;
  const action = document.querySelector('.trade-type-btn.active').dataset.type;

  if (action === 'buy') {
    if (state.balance < total) return alert("Insufficient funds");
    state.balance -= total;
    state.holdings[currentTrade.symbol] = (state.holdings[currentTrade.symbol] || 0) + qty;
  } else {
    if ((state.holdings[currentTrade.symbol] || 0) < qty) return alert("Insufficient shares");
    state.balance += total;
    state.holdings[currentTrade.symbol] -= qty;
  }

  state.trades.push({
    symbol: currentTrade.symbol,
    qty,
    price,
    type: action,
    date: new Date().toISOString(),
    amount: total,
    status: 'completed'
  });

  saveSession();
  updateMarket();
  updatePortfolioValues();
  document.getElementById('trade-modal').classList.add('hidden');
}

// ========== PORTFOLIO UI ==========
function updatePortfolioValues() {
  const table = document.getElementById('portfolio-stocks');
  table.innerHTML = '';
  let investment = 0;
  let currentValue = 0;

  Object.keys(state.holdings).forEach(symbol => {
    const qty = state.holdings[symbol];
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (!stock || qty === 0) return;

    const avgPrice = stock.price;
    const value = qty * stock.price;
    investment += qty * avgPrice;
    currentValue += value;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${symbol}</td>
      <td>${qty}</td>
      <td>₹${avgPrice.toFixed(2)}</td>
      <td>₹${stock.price.toFixed(2)}</td>
      <td class="${value >= investment ? 'positive' : 'negative'}">₹${(value - investment).toFixed(2)}</td>
      <td>
        <button class="action-btn sell" onclick="openTradeModal('${symbol}', 'sell')">Sell</button>
      </td>
    `;
    table.appendChild(row);
  });

  document.getElementById('total-investment').textContent = `₹${investment.toFixed(2)}`;
  document.getElementById('current-value').textContent = `₹${currentValue.toFixed(2)}`;
  const profit = currentValue - investment;
  document.getElementById('profit-loss').textContent = `₹${profit.toFixed(2)}`;
  document.getElementById('profit-loss-percent').textContent = `${((profit / investment) * 100).toFixed(2)}%`;
}