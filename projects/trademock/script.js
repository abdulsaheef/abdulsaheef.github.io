// API & CONFIG
const API_KEY = '8aabf877b0ec41bd87662871378e0ef4';
const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS'];

// App State
let state = { user:null, balance:100000, holdings:{}, dematQueue:[], trades:[], stocks:[] };

// DOM
const loginForm = document.getElementById('login-form');
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const profileUsername = document.getElementById('profile-username');
const profileBalance = document.getElementById('profile-balance');
const availableBalance = document.getElementById('available-balance');
const logoutBtn = document.getElementById('logout-btn');
const stocksContainer = document.getElementById('market-section');
const portfolioSection = document.getElementById('portfolio-section');
const dematSection = document.getElementById('demat-section');
const historySection = document.getElementById('history-section');
const portfolioTable = portfolioSection;
const pendingSettlements = dematSection;
const historyTable = historySection;

// Trade Modal DOM
const tradeModal = document.getElementById('trade-modal');
const modalClose = tradeModal.querySelector('.modal-close');
const tradeQty = document.getElementById('trade-qty');
const tradePrice = document.getElementById('trade-price');
const tradeTotal = document.getElementById('trade-total');
const tradeBrokerage = document.getElementById('trade-brokerage');
const tradeNet = document.getElementById('trade-net');
const tradeSubmit = document.getElementById('trade-submit');
const typeButtons = document.querySelectorAll('.trade-type-btn');

let currentTrade = { symbol:'', action:'buy' };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupNav();
  setupModal();
  loadStocks();
  setInterval(loadStocks,60000);
});

// Login & Session
function setupLogin(){
  loginForm.onsubmit = e => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    if(!u) return;
    state.user=u; loadSession();
    profileUsername.textContent=u;
    profileBalance.textContent=state.balance.toFixed(2);
    availableBalance.textContent=state.balance.toFixed(2);
    authScreen.style.display='none'; appContainer.style.display='flex';
    refreshAll();
  };
  logoutBtn.onclick = ()=>location.reload();
}
function loadSession(){
  const data = localStorage.getItem(`tm_${state.user}`);
  if(data) state = Object.assign(state, JSON.parse(data));
}
function saveSession(){
  localStorage.setItem(`tm_${state.user}`, JSON.stringify(state));
}

// Navigation
function setupNav(){
  document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
    btn.onclick = ()=> {
      const section = btn.dataset.section;
      document.querySelectorAll('.content-section').forEach(s=>s.classList.add('hidden'));
      document.getElementById(section+'-section').classList.remove('hidden');
      document.getElementById('section-title').textContent = section.charAt(0).toUpperCase()+section.slice(1);
      document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll(`[data-section="${section}"]`).forEach(x=>x.classList.add('active'));
      refreshAll();
    };
  });
}

// Fetch Stocks
async function loadStocks(){
  try {
    const syms = DEFAULT_SYMBOLS.join(',');
    const res = await fetch(`${BASE_URL}/quote?symbol=${syms}&apikey=${API_KEY}`);
    const data = await res.json();
    state.stocks = DEFAULT_SYMBOLS.map(sym=>{
      const base = sym.replace('.NS','');
      const q=data[sym]||{};
      return { symbol:base, name:q.name||base, price:+q.price||0, change:+q.change||0, changePercent:+q.percent_change||0 };
    });
    refreshAll();
  } catch(e){ console.error(e); }
}

// Render Functions
function refreshAll(){
  renderMarket();
  renderPortfolio();
  renderDemat();
  renderHistory();
  profileBalance.textContent=state.balance.toFixed(2);
  availableBalance.textContent=state.balance.toFixed(2);
  saveSession();
}

// Market UI
function renderMarket(){
  stocksContainer.innerHTML='';
  const div = document.createElement('div');
  div.className='stocks-grid';
  state.stocks.forEach(s=>{
    const card=document.createElement('div');
    card.className='stock-card';
    card.innerHTML=`
      <div class="stock-header">
        <div><strong>${s.symbol}</strong><span class="stock-symbol">${s.name}</span></div>
        <div class="stock-price">₹${s.price.toFixed(2)}</div>
      </div>
      <div class="stock-change ${s.change>=0?'positive':'negative'}">
        ${(s.change>=0?'+':'') + s.change.toFixed(2)} (${s.changePercent.toFixed(2)}%)
      </div>
      <div class="stock-actions">
        <button class="stock-btn buy">Buy</button>
        <button class="stock-btn sell">Sell</button>
      </div>`;
    div.appendChild(card);
    card.querySelector('.buy').onclick = ()=> openTrade(s,'buy');
    card.querySelector('.sell').onclick = ()=> openTrade(s,'sell');
  });
  stocksContainer.appendChild(div);
}

// Trade Modal Setup
function setupModal(){
  modalClose.onclick = ()=>tradeModal.classList.add('hidden');
  typeButtons.forEach(btn=>btn.onclick=() => {
    typeButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentTrade.action = btn.dataset.type;
    updateSummary();
  });
  [tradeQty, tradePrice].forEach(el=>el.oninput=updateSummary);
  tradeSubmit.onclick = submitTrade;
}

// Open trade modal
function openTrade(stock, action){
  currentTrade = { symbol:stock.symbol, action };
  document.getElementById('trade-stock-symbol').textContent = stock.symbol;
  document.getElementById('trade-stock-name').textContent = stock.name;
  tradeQty.value = 1; tradePrice.value = stock.price.toFixed(2);
  updateSummary();
  typeButtons.forEach(b=> b.classList.toggle('active', b.dataset.type===action));
  tradeModal.classList.remove('hidden');
}

// Update cost summary
function updateSummary(){
  const qty=+tradeQty.value || 0, price=+tradePrice.value || 0, amt=qty*price;
  const brokerage=amt*0.001, net = currentTrade.action==='buy'? amt+brokerage : amt-brokerage;
  tradeTotal.textContent=`₹${amt.toFixed(2)}`;
  tradeBrokerage.textContent=`₹${brokerage.toFixed(2)}`;
  tradeNet.textContent=`₹${net.toFixed(2)}`;
}

// Execute trade
function submitTrade(){
  const qty = +tradeQty.value, price = +tradePrice.value;
  if(!qty || !price) return alert('Enter valid qty & price');
  if(currentTrade.action==='buy' && price*qty>state.balance) return alert('Insufficient funds');
  if(currentTrade.action==='sell' && (state.holdings[currentTrade.symbol]||0)<qty) return alert('Insufficient shares');

  if(currentTrade.action==='buy') state.balance -= qty*price;
  else state.balance += qty*price;

  state.holdings[currentTrade.symbol] = (state.holdings[currentTrade.symbol]||0) + (currentTrade.action==='buy'?qty:-qty);
  if(state.holdings[currentTrade.symbol]<=0) delete state.holdings[currentTrade.symbol];

  state.trades.push({
    symbol: currentTrade.symbol,
    type: currentTrade.action,
    qty, price,
    date: new Date().toISOString()
  });

  tradeModal.classList.add('hidden');
  refreshAll();
}