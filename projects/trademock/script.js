// API Configuration
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['RELIANCE.NS', 'TATASTEEL.NS', 'HDFCBANK.NS', 'INFY.NS', 'TCS.NS'];

// App State
let state = {
  user: null,
  balance: 100000,
  holdings: {},
  dematQueue: [],
  trades: [],
  stocks: []
};

// DOM Elements
const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app-container');
const profileUsername = document.getElementById('profile-username');
const profileBalance = document.getElementById('profile-balance');
const availableBalance = document.getElementById('available-balance');
const logoutBtn = document.getElementById('logout-btn');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  setupLogin();
  setupNavigation();
  setupTradeModal();
  
  // Load stocks every minute
  loadStocks();
  setInterval(loadStocks, 60000);
});

// Login System
function setupLogin() {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (!username) return;
    
    state.user = username;
    loadSession();
    
    // Update UI
    profileUsername.textContent = username;
    profileBalance.textContent = state.balance.toFixed(2);
    availableBalance.textContent = state.balance.toFixed(2);
    
    // Show app
    document.getElementById('auth-screen').style.display = 'none';
    appContainer.style.display = 'block';
  });
}

function loadSession() {
  const savedData = localStorage.getItem(`trademock_${state.user}`);
  if (savedData) {
    const data = JSON.parse(savedData);
    state.balance = data.balance || 100000;
    state.holdings = data.holdings || {};
    state.dematQueue = data.dematQueue || [];
    state.trades = data.trades || [];
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

// Navigation
function setupNavigation() {
  // Desktop sidebar nav
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      navItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      showSection(this.dataset.section);
      updateMobileNav(this.dataset.section);
    });
  });
  
  // Mobile bottom nav
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      mobileNavBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      showSection(this.dataset.section);
      updateDesktopNav(this.dataset.section);
    });
  });
  
  // Demat tabs
  const dematTabs = document.querySelectorAll('.demat-tab');
  dematTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      dematTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.demat-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`demat-${this.dataset.tab}`).classList.remove('hidden');
    });
  });
  
  // Logout
  logoutBtn.addEventListener('click', function() {
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
  const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
  mobileBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.section === section) {
      btn.classList.add('active');
    }
  });
}

function updateDesktopNav(section) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === section) {
      item.classList.add('active');
    }
  });
}

// Stock Data
async function loadStocks() {
  try {
    const symbols = DEFAULT_SYMBOLS.join(',');
    const response = await fetch(`${BASE_URL}/price?symbol=${symbols}&apikey=${API_KEY}`);
    const priceData = await response.json();
    
    const quoteResponse = await fetch(`${BASE_URL}/quote?symbol=${symbols}&apikey=${API_KEY}`);
    const quoteData = await quoteResponse.json();
    
    state.stocks = DEFAULT_SYMBOLS.map(symbol => {
      const baseSymbol = symbol.replace('.NS', '');
      const quote = quoteData[symbol] || {};
      return {
        symbol: baseSymbol,
        name: quote.name || baseSymbol,
        price: parseFloat(priceData[symbol]?.price || 0),
        change: parseFloat(quote.change || 0),
        changePercent: parseFloat(quote.percent_change || 0)
      };
    });
    
    updateMarket();
    updatePortfolioValues();
  } catch (error) {
    console.error('Error fetching stock data:', error);
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
        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
      </div>
      <div class="stock-actions">
        <button class="stock-btn buy" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'buy')">
          Buy
        </button>
        <button class="stock-btn sell" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'sell')">
          Sell
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Portfolio
function updatePortfolioValues() {
  let totalInvested = 0;
  let currentValue = 0;
  
  // Update portfolio with current prices
  Object.keys(state.holdings).forEach(symbol => {
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (stock) {
      state.holdings[symbol].currentPrice = stock.price;
      state.holdings[symbol].currentValue = stock.price * state.holdings[symbol].qty;
      state.holdings[symbol].pnl = state.holdings[symbol].currentValue - state.holdings[symbol].invested;
      state.holdings[symbol].pnlPercent = (state.holdings[symbol].pnl / state.holdings[symbol].invested) * 100;
      
      totalInvested += state.holdings[symbol].invested;
      currentValue += state.holdings[symbol].currentValue;
    }
  });
  
  // Update UI
  document.getElementById('total-investment').textContent = `₹${totalInvested.toFixed(2)}`;
  document.getElementById('current-value').textContent = `₹${currentValue.toFixed(2)}`;
  
  const totalPnl = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  
  document.getElementById('profit-loss').textContent = `₹${totalPnl.toFixed(2)}`;
  document.getElementById('profit-loss-percent').textContent = `${pnlPercent.toFixed(2)}%`;
  document.getElementById('profit-loss-percent').className = `summary-change ${totalPnl >= 0 ? 'positive' : 'negative'}`;
  
  // Update portfolio table
  const portfolioTable = document.getElementById('portfolio-stocks');
  portfolioTable.innerHTML = '';
  
  Object.values(state.holdings).forEach(stock => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${stock.symbol}</strong>
        <div class="text-muted">${stock.name}</div>
      </td>
      <td>${stock.qty}</td>
      <td>₹${stock.avgPrice.toFixed(2)}</td>
      <td>₹${stock.currentPrice.toFixed(2)}</td>
      <td class="${stock.pnl >= 0 ? 'positive' : 'negative'}">
        ₹${stock.pnl.toFixed(2)}<br>
        <small>${stock.pnlPercent.toFixed(2)}%</small>
      </td>
      <td>
        <button class="action-btn view" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.currentPrice}, 'buy')">
          Buy
        </button>
        <button class="action-btn sell" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.currentPrice}, 'sell')">
          Sell
        </button>
      </td>
    `;
    portfolioTable.appendChild(row);
  });
  
  // Update demat tables
  updateDematTables();
  
  // Update trade history
  updateTradeHistory();
}

function updateDematTables() {
  const pendingTable = document.getElementById('pending-settlements');
  const completedTable = document.getElementById('completed-settlements');
  
  pendingTable.innerHTML = '';
  completedTable.innerHTML = '';
  
  // Process T+2 settlements
  const today = new Date().toISOString().split('T')[0];
  state.dematQueue = state.dematQueue.filter(item => {
    if (item.settleDate <= today) {
      // Move to completed
      completedTable.appendChild(createDematRow(item));
      return false;
    }
    pendingTable.appendChild(createDematRow(item));
    return true;
  });
}

function createDematRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${new Date(item.buyDate).toLocaleDateString()}</td>
    <td>${item.symbol}</td>
    <td>Buy</td>
    <td>${item.qty}</td>
    <td>₹${item.price.toFixed(2)}</td>
    <td>₹${(item.qty * item.price).toFixed(2)}</td>
    <td>${item.settleDate}</td>
  `;
  return row;
}

function updateTradeHistory() {
  const historyTable = document.getElementById('trade-history');
  historyTable.innerHTML = '';
  
  state.trades.slice().reverse().forEach(trade => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(trade.time).toLocaleString()}</td>
      <td>${trade.symbol}</td>
      <td class="${trade.type}">${trade.type.toUpperCase()}</td>
      <td>${Math.abs(trade.qty)}</td>
      <td>₹${trade.price.toFixed(2)}</td>
      <td>₹${(trade.qty * trade.price).toFixed(2)}</td>
      <td><span class="status completed">COMPLETED</span></td>
    `;
    historyTable.appendChild(row);
  });
}

// Trade Modal
function setupTradeModal() {
  const modal = document.getElementById('trade-modal');
  const closeBtn = document.querySelector('.modal-close');
  const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
  const tradeSubmitBtn = document.getElementById('trade-submit');
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  tradeTypeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tradeTypeBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateTradeTotal();
    });
  });
  
  document.getElementById('trade-qty').addEventListener('input', updateTradeTotal);
  document.getElementById('trade-price').addEventListener('input', updateTradeTotal);
  
  tradeSubmitBtn.addEventListener('click', executeTrade);
}

function openTradeModal(symbol, name, price, type) {
  const modal = document.getElementById('trade-modal');
  const title = document.getElementById('trade-modal-title');
  const typeBtns = document.querySelectorAll('.trade-type-btn');
  
  title.textContent = type === 'buy' ? 'Buy Stock' : 'Sell Stock';
  document.getElementById('trade-stock-symbol').textContent = symbol;
  document.getElementById('trade-stock-name').textContent = name;
  document.getElementById('trade-stock-price').textContent = `₹${price.toFixed(2)}`;
  document.getElementById('trade-price').value = price.toFixed(2);
  document.getElementById('trade-qty').value = '1';
  
  typeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.type === type) {
      btn.classList.add('active');
    }
  });
  
  updateTradeTotal();
  modal.classList.add('show');
}

function updateTradeTotal() {
  const qty = parseInt(document.getElementById('trade-qty').value) || 0;
  const price = parseFloat(document.getElementById('trade-price').value) || 0;
  const total = qty * price;
  
  document.getElementById('trade-total').textContent = `₹${total.toFixed(2)}`;
  
  // Calculate brokerage (0.1% or min ₹20)
  const brokerage = Math.max(total * 0.001, 20);
  document.getElementById('trade-brokerage').textContent = `₹${brokerage.toFixed(2)}`;
  
  // Calculate net amount
  const netAmount = total + brokerage;
  document.getElementById('trade-net').textContent = `₹${netAmount.toFixed(2)}`;
}

function executeTrade() {
  const type = document.querySelector('.trade-type-btn.active').dataset.type;
  const symbol = document.getElementById('trade-stock-symbol').textContent;
  const name = document.getElementById('trade-stock-name').textContent;
  const qty = parseInt(document.getElementById('trade-qty').value);
  const price = parseFloat(document.getElementById('trade-price').value);
  const total = qty * price;
  const brokerage = Math.max(total * 0.001, 20);
  const netAmount = total + brokerage;
  
  if (type === 'buy') {
    if (netAmount > state.balance) {
      alert('Insufficient balance for this trade');
      return;
    }
    
    // Update balance
    state.balance -= netAmount;
    
    // Add to demat queue (T+2 settlement)
    const settleDate = new Date();
    settleDate.setDate(settleDate.getDate() + 2);
    state.dematQueue.push({
      symbol,
      qty,
      price,
      buyDate: new Date().toISOString(),
      settleDate: settleDate.toISOString().split('T')[0]
    });
  } else { // Sell
    if (!state.holdings[symbol] || state.holdings[symbol].qty < qty) {
      alert('Not enough shares to sell');
      return;
    }
    
    // Update balance (we add the total amount minus brokerage)
    state.balance += (total - brokerage);
    
    // Update portfolio
    state.holdings[symbol].qty -= qty;
    state.holdings[symbol].invested = state.holdings[symbol].avgPrice * state.holdings[symbol].qty;
    
    // Remove from portfolio if quantity reaches zero
    if (state.holdings[symbol].qty === 0) {
      delete state.holdings[symbol];
    }
  }
  
  // Record the trade
  state.trades.push({
    symbol,
    name,
    type,
    qty: type === 'buy' ? qty : -qty,
    price,
    amount: total,
    brokerage,
    time: new Date().toISOString()
  });
  
  // If buy, check if we already have this stock in portfolio to update average price
  if (type === 'buy') {
    if (state.holdings[symbol]) {
      const existing = state.holdings[symbol];
      const newQty = existing.qty + qty;
      const newAvg = ((existing.avgPrice * existing.qty) + (price * qty)) / newQty;
      state.holdings[symbol] = {
        ...existing,
        qty: newQty,
        avgPrice: newAvg,
        invested: newAvg * newQty
      };
    }
  }
  
  // Close modal and update UI
  document.getElementById('trade-modal').classList.remove('show');
  saveSession();
  updateUI();
}

// Update all UI elements
function updateUI() {
  profileBalance.textContent = state.balance.toFixed(2);
  availableBalance.textContent = state.balance.toFixed(2);
  
  updateMarket();
  updatePortfolioValues();
  updateDematTables();
  updateTradeHistory();
}

// Initialize trade modal
setupTradeModal();

