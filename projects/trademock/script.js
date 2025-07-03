function updatePortfolioValues() {
  const tbody = document.getElementById('portfolio-stocks');
  tbody.innerHTML = '';

  let totalInvestment = 0;
  let currentValue = 0;

  for (const symbol in state.holdings) {
    const holding = state.holdings[symbol];
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (!stock) continue;

    const avgPrice = holding.total / holding.qty;
    const ltp = stock.price;
    const value = ltp * holding.qty;
    const profit = value - holding.total;

    totalInvestment += holding.total;
    currentValue += value;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${symbol}</td>
      <td>${holding.qty}</td>
      <td>₹${avgPrice.toFixed(2)}</td>
      <td>₹${ltp.toFixed(2)}</td>
      <td class="${profit >= 0 ? 'positive' : 'negative'}">₹${profit.toFixed(2)}</td>
      <td>
        <button class="action-btn sell" onclick="openTradeModal('${symbol}', 'sell')">Sell</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  const profitLoss = currentValue - totalInvestment;
  const percentChange = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

  document.getElementById('total-investment').textContent = `₹${totalInvestment.toFixed(2)}`;
  document.getElementById('current-value').textContent = `₹${currentValue.toFixed(2)}`;
  document.getElementById('profit-loss').textContent = `₹${profitLoss.toFixed(2)}`;
  document.getElementById('profit-loss-percent').textContent = `${percentChange.toFixed(2)}%`;

  const changeSpan = document.getElementById('profit-loss-percent');
  changeSpan.classList.toggle('positive', profitLoss >= 0);
  changeSpan.classList.toggle('negative', profitLoss < 0);
}

function updateDematView() {
  const pendingBody = document.getElementById('pending-settlements');
  const completedBody = document.getElementById('completed-settlements');

  pendingBody.innerHTML = '';
  completedBody.innerHTML = '';

  const now = new Date();

  state.dematQueue.forEach(entry => {
    const settleDate = new Date(entry.settlement);
    const row = `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.symbol}</td>
        <td>${entry.type.toUpperCase()}</td>
        <td>${entry.qty}</td>
        <td>₹${entry.price.toFixed(2)}</td>
        <td>₹${(entry.qty * entry.price).toFixed(2)}</td>
        <td>${entry.settlement}</td>
      </tr>
    `;

    if (settleDate > now) {
      pendingBody.innerHTML += row;
    } else {
      completedBody.innerHTML += row;
    }
  });
}

function updateTradeHistory() {
  const tbody = document.getElementById('trade-history');
  tbody.innerHTML = '';

  const typeFilter = document.getElementById('history-type').value;
  const periodFilter = document.getElementById('history-period').value;
  const now = new Date();

  state.trades
    .filter(trade => {
      if (typeFilter !== 'all' && trade.type !== typeFilter) return false;
      if (periodFilter !== 'all') {
        const days = parseInt(periodFilter);
        const tradeDate = new Date(trade.date);
        const diffTime = Math.abs(now - tradeDate);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }
      return true;
    })
    .forEach(trade => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${trade.date}</td>
        <td>${trade.symbol}</td>
        <td>${trade.type.toUpperCase()}</td>
        <td>${trade.qty}</td>
        <td>₹${trade.price.toFixed(2)}</td>
        <td>₹${(trade.qty * trade.price).toFixed(2)}</td>
        <td><span class="status completed">Executed</span></td>
      `;
      tbody.appendChild(row);
    });
}

// Hook into history filters
document.addEventListener('DOMContentLoaded', () => {
  const historyType = document.getElementById('history-type');
  const historyPeriod = document.getElementById('history-period');

  historyType.addEventListener('change', updateTradeHistory);
  historyPeriod.addEventListener('change', updateTradeHistory);
});