// API Configuration
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['RELIANCE', 'TATASTEEL', 'HDFCBANK', 'INFY', 'TCS', 'ITC', 'BHARTIARTL', 'HINDUNILVR', 'ICICIBANK', 'SBIN'];

// DOM Elements
const stocksContainer = document.getElementById('stocks-container');
const portfolioStocks = document.getElementById('portfolio-stocks');
const pendingSettlements = document.getElementById('pending-settlements');
const completedSettlements = document.getElementById('completed-settlements');
const tradeHistory = document.getElementById('trade-history');
const availableBalance = document.getElementById('available-balance');
const profileBalance = document.getElementById('profile-balance');

// App State
let stocksData = {};
let portfolio = {};
let demat = { pending: [], completed: [] };
let tradeHistoryData = [];
let balance = 100000; // Starting balance

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupEventListeners();
    fetchMarketData();
    loadUserData();
    updateUI();
    
    // Set up interval to fetch prices every 10 seconds
    setInterval(fetchMarketData, 10000);
});

// Navigation Setup (same as before)
function setupNavigation() {
    // ... (keep the existing navigation code from previous version)
}

// Event Listeners
function setupEventListeners() {
    // Trade modal close button
    document.querySelector('.modal-close').addEventListener('click', closeTradeModal);
    
    // Trade type buttons
    const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
    tradeTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tradeTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Trade submit button
    document.getElementById('trade-submit').addEventListener('click', executeTrade);
    
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (username) {
            document.getElementById('profile-username').textContent = username;
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
        }
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    });
}

// Fetch Market Data from TwelveData API
async function fetchMarketData() {
    try {
        // Fetch price data for all default symbols
        const symbols = DEFAULT_SYMBOLS.join(',');
        const response = await fetch(`${BASE_URL}/price?symbol=${symbols}&apikey=${API_KEY}`);
        const priceData = await response.json();
        
        // Fetch quote data for additional info (change, percent change)
        const quoteResponse = await fetch(`${BASE_URL}/quote?symbol=${symbols}&apikey=${API_KEY}`);
        const quoteData = await quoteResponse.json();
        
        // Process the data
        DEFAULT_SYMBOLS.forEach(symbol => {
            if (priceData[symbol] && !priceData[symbol].error) {
                const price = parseFloat(priceData[symbol].price);
                const quote = quoteData[symbol];
                
                stocksData[symbol] = {
                    symbol: symbol,
                    name: quote.name || symbol,
                    price: price,
                    change: parseFloat(quote.change || 0),
                    changePercent: parseFloat(quote.percent_change || 0),
                    high: parseFloat(quote.high || 0),
                    low: parseFloat(quote.low || 0),
                    open: parseFloat(quote.open || 0),
                    previousClose: parseFloat(quote.previous_close || 0)
                };
            }
        });
        
        updateStocksDisplay();
        updatePortfolioValues();
    } catch (error) {
        console.error('Error fetching market data:', error);
        // Fallback: Use previous data if available
        if (Object.keys(stocksData).length > 0) {
            updateStocksDisplay();
        }
    }
}

// Update Stocks Display
function updateStocksDisplay() {
    stocksContainer.innerHTML = '';
    
    Object.values(stocksData).forEach(stock => {
        const stockCard = document.createElement('div');
        stockCard.className = 'stock-card';
        stockCard.dataset.symbol = stock.symbol;
        stockCard.innerHTML = `
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
        stocksContainer.appendChild(stockCard);
    });
}

// Trade Modal Functions
function openTradeModal(stockSymbol, stockName, stockPrice, action = 'buy') {
    document.getElementById('trade-modal-title').textContent = action === 'buy' ? 'Buy Stock' : 'Sell Stock';
    document.getElementById('trade-stock-symbol').textContent = stockSymbol;
    document.getElementById('trade-stock-name').textContent = stockName;
    document.getElementById('trade-stock-price').textContent = `₹${stockPrice.toFixed(2)}`;
    document.getElementById('trade-price').value = stockPrice.toFixed(2);
    
    // Set trade type
    const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
    tradeTypeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === action) {
            btn.classList.add('active');
        }
    });
    
    // Update total amount when quantity or price changes
    document.getElementById('trade-qty').addEventListener('input', updateTradeTotal);
    document.getElementById('trade-price').addEventListener('input', updateTradeTotal);
    
    // Show modal
    document.getElementById('trade-modal').classList.add('show');
}

function closeTradeModal() {
    document.getElementById('trade-modal').classList.remove('show');
    // Remove event listeners to prevent duplicates
    document.getElementById('trade-qty').removeEventListener('input', updateTradeTotal);
    document.getElementById('trade-price').removeEventListener('input', updateTradeTotal);
}

function updateTradeTotal() {
    const qty = parseInt(document.getElementById('trade-qty').value) || 0;
    const price = parseFloat(document.getElementById('trade-price').value) || 0;
    const total = qty * price;
    
    document.getElementById('trade-total').textContent = `₹${total.toFixed(2)}`;
    
    // Calculate brokerage (example: 0.1% or min ₹20)
    const brokerage = Math.max(total * 0.001, 20);
    document.getElementById('trade-brokerage').textContent = `₹${brokerage.toFixed(2)}`;
    
    // Calculate net amount
    const netAmount = total + brokerage;
    document.getElementById('trade-net').textContent = `₹${netAmount.toFixed(2)}`;
}

// Execute Trade
function executeTrade() {
    const action = document.querySelector('.trade-type-btn.active').getAttribute('data-type');
    const symbol = document.getElementById('trade-stock-symbol').textContent;
    const name = document.getElementById('trade-stock-name').textContent;
    const qty = parseInt(document.getElementById('trade-qty').value);
    const price = parseFloat(document.getElementById('trade-price').value);
    const total = qty * price;
    const brokerage = Math.max(total * 0.001, 20);
    const netAmount = total + brokerage;
    
    if (action === 'buy') {
        if (netAmount > balance) {
            alert('Insufficient balance for this trade');
            return;
        }
        
        // Update balance
        balance -= netAmount;
        
        // Add to portfolio or update existing position
        if (portfolio[symbol]) {
            const avgPrice = ((portfolio[symbol].avgPrice * portfolio[symbol].qty) + (price * qty)) / (portfolio[symbol].qty + qty);
            portfolio[symbol] = {
                ...portfolio[symbol],
                qty: portfolio[symbol].qty + qty,
                avgPrice: avgPrice,
                invested: portfolio[symbol].invested + total
            };
        } else {
            portfolio[symbol] = {
                symbol: symbol,
                name: name,
                qty: qty,
                avgPrice: price,
                invested: total
            };
        }
    } else { // Sell
        if (!portfolio[symbol] || portfolio[symbol].qty < qty) {
            alert('You don\'t have enough shares to sell');
            return;
        }
        
        // Update balance (we add the total amount minus brokerage)
        balance += (total - brokerage);
        
        // Update portfolio
        portfolio[symbol].qty -= qty;
        portfolio[symbol].invested = portfolio[symbol].avgPrice * portfolio[symbol].qty;
        
        // Remove from portfolio if quantity reaches zero
        if (portfolio[symbol].qty === 0) {
            delete portfolio[symbol];
        }
    }
    
    // Record the trade
    const tradeRecord = {
        date: new Date().toISOString(),
        symbol: symbol,
        name: name,
        type: action,
        qty: qty,
        price: price,
        amount: total,
        brokerage: brokerage,
        status: 'completed'
    };
    
    tradeHistoryData.unshift(tradeRecord);
    
    // For sells, add to demat (T+2 settlement)
    if (action === 'sell') {
        const settlementDate = new Date();
        settlementDate.setDate(settlementDate.getDate() + 2);
        
        demat.pending.unshift({
            ...tradeRecord,
            settlementDate: settlementDate.toISOString()
        });
    }
    
    // Update UI
    closeTradeModal();
    updateUI();
    saveUserData();
}

// Update Portfolio Values with current prices
function updatePortfolioValues() {
    let totalInvested = 0;
    let currentValue = 0;
    
    Object.keys(portfolio).forEach(symbol => {
        if (stocksData[symbol]) {
            const currentPrice = stocksData[symbol].price;
            portfolio[symbol].currentPrice = currentPrice;
            portfolio[symbol].currentValue = currentPrice * portfolio[symbol].qty;
            portfolio[symbol].pnl = portfolio[symbol].currentValue - portfolio[symbol].invested;
            portfolio[symbol].pnlPercent = (portfolio[symbol].pnl / portfolio[symbol].invested) * 100;
            
            totalInvested += portfolio[symbol].invested;
            currentValue += portfolio[symbol].currentValue;
        }
    });
    
    // Check for pending settlements that are now complete
    const now = new Date();
    demat.pending = demat.pending.filter(item => {
        if (new Date(item.settlementDate) <= now) {
            demat.completed.unshift(item);
            return false;
        }
        return true;
    });
    
    // Update UI
    updateUI();
}

// Update All UI Elements
function updateUI() {
    // Update balance displays
    availableBalance.textContent = balance.toFixed(2);
    profileBalance.textContent = balance.toFixed(2);
    
    // Update portfolio summary
    let totalInvested = 0;
    let currentValue = 0;
    let totalPnl = 0;
    
    Object.values(portfolio).forEach(stock => {
        totalInvested += stock.invested;
        currentValue += (stock.currentPrice || stock.avgPrice) * stock.qty;
    });
    
    totalPnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    
    document.getElementById('total-investment').textContent = `₹${totalInvested.toFixed(2)}`;
    document.getElementById('current-value').textContent = `₹${currentValue.toFixed(2)}`;
    document.getElementById('profit-loss').textContent = `₹${totalPnl.toFixed(2)}`;
    document.getElementById('profit-loss-percent').textContent = `${pnlPercent.toFixed(2)}%`;
    document.getElementById('profit-loss-percent').className = `summary-change ${totalPnl >= 0 ? 'positive' : 'negative'}`;
    
    // Update portfolio table
    portfolioStocks.innerHTML = '';
    Object.values(portfolio).forEach(stock => {
        const currentPrice = stock.currentPrice || stock.avgPrice;
        const currentValue = currentPrice * stock.qty;
        const pnl = currentValue - stock.invested;
        const pnlPercent = (pnl / stock.invested) * 100;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${stock.symbol}</strong>
                <div class="text-muted">${stock.name}</div>
            </td>
            <td>${stock.qty}</td>
            <td>₹${stock.avgPrice.toFixed(2)}</td>
            <td>₹${currentPrice.toFixed(2)}</td>
            <td class="${pnl >= 0 ? 'positive' : 'negative'}">
                ₹${pnl.toFixed(2)}<br>
                <small>${pnlPercent.toFixed(2)}%</small>
            </td>
            <td>
                <button class="action-btn view" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${currentPrice}, 'buy')">
                    Buy
                </button>
                <button class="action-btn sell" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${currentPrice}, 'sell')">
                    Sell
                </button>
            </td>
        `;
        portfolioStocks.appendChild(row);
    });
    
    // Update demat tables
    updateDematTable('pending');
    updateDematTable('completed');
    
    // Update trade history
    updateTradeHistory();
}

function updateDematTable(type) {
    const tableBody = document.getElementById(`${type}-settlements`);
    tableBody.innerHTML = '';
    
    demat[type].forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.date);
        const settlementDate = type === 'pending' ? new Date(item.settlementDate) : new Date(item.date);
        
        row.innerHTML = `
            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
            <td>${item.symbol}</td>
            <td>${item.type}</td>
            <td>${item.qty}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${item.amount.toFixed(2)}</td>
            <td>${settlementDate.toLocaleDateString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateTradeHistory() {
    tradeHistory.innerHTML = '';
    
    tradeHistoryData.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.date);
        
        row.innerHTML = `
            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
            <td>${item.symbol}</td>
            <td class="${item.type}">${item.type.toUpperCase()}</td>
            <td>${item.qty}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${item.amount.toFixed(2)}</td>
            <td><span class="status ${item.status}">${item.status.toUpperCase()}</span></td>
        `;
        tradeHistory.appendChild(row);
    });
}

// Local Storage Functions
function saveUserData() {
    const userData = {
        portfolio: portfolio,
        demat: demat,
        tradeHistory: tradeHistoryData,
        balance: balance,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('tradeMockUserData', JSON.stringify(userData));
}

function loadUserData() {
    const savedData = localStorage.getItem('tradeMockUserData');
    if (savedData) {
        const userData = JSON.parse(savedData);
        portfolio = userData.portfolio || {};
        demat = userData.demat || { pending: [], completed: [] };
        tradeHistoryData = userData.tradeHistory || [];
        balance = userData.balance || 100000;
    }
}

