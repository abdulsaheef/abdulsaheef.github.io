// DOM Elements
const tabs = document.querySelectorAll('nav button');
const contents = document.querySelectorAll('.tab-content');
const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
const calendarGrid = document.getElementById('calendar-grid');
const exportBtn = document.getElementById('export-btn');
const aiScheduleBtn = document.getElementById('ai-schedule-btn');
const currencySelect = document.getElementById('currency-select');
const riskThresholdInput = document.getElementById('risk-threshold');
const saveSettingsBtn = document.getElementById('save-settings');
const alertContainer = document.getElementById('alert-container');
const aiInsightsContainer = document.getElementById('ai-insights');
const notification = document.getElementById('notification');

// State
let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
let scheduled = JSON.parse(localStorage.getItem('scheduled') || '{}');
let currency = localStorage.getItem('currency') || 'AED';
let riskThreshold = parseInt(localStorage.getItem('riskThreshold')) || 7;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCurrencySelector();
  renderVendors();
  renderCalendar();
  updateDashboard();
  generateAlerts();
  renderAIInsights();
  
  riskThresholdInput.value = riskThreshold;
});

// Navigation
function initNavigation() {
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

// Currency
function initCurrencySelector() {
  const currencies = [
  // Americas
  { code: "USD", name: "US Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "VES", name: "Venezuelan Bolívar" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "PYG", name: "Paraguayan Guaraní" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "TTD", name: "Trinidad and Tobago Dollar" },
  { code: "BZD", name: "Belize Dollar" },

  // Europe
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Złoty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "ALL", name: "Albanian Lek" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "KZT", name: "Kazakhstani Tenge" },

  // Asia
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "VND", name: "Vietnamese Đồng" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "LAK", name: "Lao Kip" },
  { code: "MNT", name: "Mongolian Tögrög" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "MOP", name: "Macanese Pataca" },
  { code: "BND", name: "Brunei Dollar" },
  { code: "AFN", name: "Afghan Afghani" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "IQD", name: "Iraqi Dinar" },
  { code: "SYP", name: "Syrian Pound" },
  { code: "YER", name: "Yemeni Rial" },
  { code: "OMR", name: "Omani Rial" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "AED", name: "UAE Dirham" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "LBP", name: "Lebanese Pound" },

  // Africa
  { code: "ZAR", name: "South African Rand" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "CDF", name: "Congolese Franc" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "AOA", name: "Angolan Kwanza" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "BIF", name: "Burundian Franc" },
  { code: "DJF", name: "Djiboutian Franc" },
  { code: "SOS", name: "Somali Shilling" },
  { code: "SDG", name: "Sudanese Pound" },
  { code: "SSP", name: "South Sudanese Pound" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "LRD", name: "Liberian Dollar" },
  { code: "SLL", name: "Sierra Leonean Leone" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "MGA", name: "Malagasy Ariary" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "SCR", name: "Seychellois Rupee" },
  { code: "STN", name: "São Tomé and Príncipe Dobra" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "LSL", name: "Lesotho Loti" },
  { code: "SZL", name: "Swazi Lilangeni" },

  // Oceania
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "FJD", name: "Fijian Dollar" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "WST", name: "Samoan Tālā" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "SBD", name: "Solomon Islands Dollar" },
  { code: "VUV", name: "Vanuatu Vatu" },
  { code: "XPF", name: "CFP Franc" },
  { code: "KID", name: "Kiribati Dollar" },

  // Others (Digital/Crypto)
  { code: "XBT", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "XRP", name: "Ripple" },
  { code: "LTC", name: "Litecoin" },
  { code: "XAU", name: "Gold (Troy Ounce)" },
  { code: "XAG", name: "Silver (Troy Ounce)" },
  { code: "XDR", name: "Special Drawing Rights (IMF)" }
];

  currencies.forEach(c => {
    const option = document.createElement('option');
    option.value = c.code;
    option.textContent = `${c.code} - ${c.name}`;
    currencySelect.appendChild(option);
  });

  currencySelect.value = currency;
}

// Vendor Management
vendorForm?.addEventListener('submit', e => {
  e.preventDefault();
  
  const vendor = {
    nickname: document.getElementById('nickname').value.trim(),
    legalName: document.getElementById('legalName').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    terms: parseInt(document.getElementById('terms').value),
    priority: document.getElementById('priority').value
  };

  if (!vendor.nickname || !vendor.legalName || isNaN(vendor.amount) || isNaN(vendor.terms)) {
    showNotification('Please fill all fields with valid data', 'error');
    return;
  }

  vendors.push(vendor);
  saveVendors();

  // Schedule initial payment
  const today = new Date();
  const dueDate = new Date(today.getTime() + vendor.terms * 86400000).toISOString().split('T')[0];
  const vendorIndex = vendors.length - 1;
  
  if (!scheduled[vendorIndex]) scheduled[vendorIndex] = [];
  if (!scheduled[vendorIndex].includes(dueDate)) {
    scheduled[vendorIndex].push(dueDate);
    saveScheduled();
  }

  vendorForm.reset();
  renderVendors();
  renderCalendar();
  updateDashboard();
  generateAlerts();
  renderAIInsights();
  showNotification('Vendor added successfully!');
});

function renderVendors() {
  if (!vendorList) return;
  
  vendorList.innerHTML = '';
  
  vendors.forEach((vendor, index) => {
    const vendorElement = document.createElement('div');
    vendorElement.className = 'vendor-item';
    vendorElement.innerHTML = `
      <div class="vendor-info">
        <div>${vendor.nickname}</div>
        <div>${formatCurrency(vendor.amount)}</div>
      </div>
      <div class="vendor-priority ${vendor.priority.toLowerCase()}">${vendor.priority}</div>
      <button class="btn-remove" data-index="${index}">×</button>
    `;
    
    vendorElement.draggable = true;
    vendorElement.dataset.vendorId = index;
    vendorElement.ondragstart = e => {
      e.dataTransfer.setData('text/plain', index);
    };

    vendorList.appendChild(vendorElement);
  });

  // Add remove event listeners
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      removeVendor(index);
    });
  });
}

function removeVendor(index) {
  if (confirm(`Remove ${vendors[index].nickname}?`)) {
    vendors.splice(index, 1);
    
    // Update scheduled payments
    const newScheduled = {};
    Object.entries(scheduled).forEach(([key, dates]) => {
      const idx = parseInt(key);
      if (idx === index) return;
      const newIndex = idx > index ? idx - 1 : idx;
      newScheduled[newIndex] = dates;
    });
    
    scheduled = newScheduled;
    saveVendors();
    saveScheduled();
    renderVendors();
    renderCalendar();
    updateDashboard();
    generateAlerts();
    renderAIInsights();
    showNotification('Vendor removed successfully');
  }
}

// Calendar
function renderCalendar() {
  if (!calendarGrid) return;
  
  calendarGrid.innerHTML = '';
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  // Create month header
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthHeader = document.createElement('div');
  monthHeader.className = 'calendar-month-header';
  monthHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  monthHeader.colSpan = 7;
  calendarGrid.appendChild(monthHeader);

  // Create day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyCell);
  }

  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

    const cell = document.createElement('div');
    cell.className = `calendar-day ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`;
    cell.dataset.date = dateStr;
    cell.innerHTML = `<div class="day-number">${day}</div>`;

    // Make cells droppable
    cell.ondragover = e => e.preventDefault();
    cell.ondrop = e => {
      e.preventDefault();
      const vendorIndex = e.dataTransfer.getData('text/plain');
      schedulePayment(vendorIndex, dateStr);
    };

    calendarGrid.appendChild(cell);
  }

  // Add scheduled payments to calendar
  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    const vendor = vendors[vendorIdx];
    if (!vendor) return;

    dates.forEach(date => {
      const cell = calendarGrid.querySelector(`.calendar-day[data-date="${date}"]`);
      if (cell) {
        const paymentElement = document.createElement('div');
        paymentElement.className = `calendar-payment payment-${vendor.priority.toLowerCase()}`;
        paymentElement.innerHTML = `
          <span>${vendor.nickname}</span>
          <span>${formatCurrency(vendor.amount)}</span>
          <button class="btn-remove-payment" data-vendor="${vendorIdx}" data-date="${date}">×</button>
        `;
        
        paymentElement.draggable = true;
        paymentElement.dataset.vendorId = vendorIdx;
        paymentElement.ondragstart = e => {
          e.dataTransfer.setData('text/plain', vendorIdx);
        };

        cell.appendChild(paymentElement);
      }
    });
  });

  // Add remove payment event listeners
  document.querySelectorAll('.btn-remove-payment').forEach(btn => {
    btn.addEventListener('click', e => {
      const vendorIdx = e.target.dataset.vendor;
      const date = e.target.dataset.date;
      removeScheduledPayment(vendorIdx, date);
    });
  });
}

function schedulePayment(vendorIndex, date) {
  if (!scheduled[vendorIndex]) scheduled[vendorIndex] = [];
  if (!scheduled[vendorIndex].includes(date)) {
    scheduled[vendorIndex].push(date);
    saveScheduled();
    renderCalendar();
    generateAlerts();
    renderAIInsights();
    showNotification('Payment scheduled');
  }
}

function removeScheduledPayment(vendorIndex, date) {
  scheduled[vendorIndex] = scheduled[vendorIndex].filter(d => d !== date);
  saveScheduled();
  renderCalendar();
  generateAlerts();
  renderAIInsights();
  showNotification('Payment removed');
}

// AI Features
function generateAlerts() {
  if (!alertContainer) return;
  
  alertContainer.innerHTML = '';
  
  // 1. Check for payment concentration
  const paymentConcentration = checkPaymentConcentration();
  if (paymentConcentration.length > 0) {
    paymentConcentration.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert-item alert-danger';
      alertElement.innerHTML = `
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>High Payment Concentration on ${alert.date}</strong>
          <p>${alert.count} payments totaling ${formatCurrency(alert.total)} due on this day</p>
          <button class="btn-secondary btn-fix" data-date="${alert.date}">Suggest Reschedule</button>
        </div>
      `;
      alertContainer.appendChild(alertElement);
    });
  }

  // 2. Check for high priority vendors with approaching due dates
  const priorityAlerts = checkPriorityVendors();
  if (priorityAlerts.length > 0) {
    priorityAlerts.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert-item alert-warning';
      alertElement.innerHTML = `
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>High Priority Payment Due Soon</strong>
          <p>${alert.vendor.nickname} (${formatCurrency(alert.vendor.amount)}) due in ${alert.daysLeft} days</p>
          <button class="btn-secondary btn-fix" data-vendor="${alert.vendorIndex}" data-date="${alert.date}">Reschedule</button>
        </div>
      `;
      alertContainer.appendChild(alertElement);
    });
  }

  // 3. Check for risk scores
  const riskAlerts = calculateRiskScores();
  if (riskAlerts.length > 0) {
    riskAlerts.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert-item alert-info';
      alertElement.innerHTML = `
        <div class="alert-icon">ℹ️</div>
        <div class="alert-content">
          <strong>Risk Assessment</strong>
          <p>${alert.vendor.nickname} has a risk score of ${alert.riskScore}/10 due to ${alert.reason}</p>
        </div>
      `;
      alertContainer.appendChild(alertElement);
    });
  }

  // Add event listeners to fix buttons
  document.querySelectorAll('.btn-fix').forEach(btn => {
    btn.addEventListener('click', e => {
      if (btn.dataset.date) {
        suggestReschedule(btn.dataset.date);
      } else if (btn.dataset.vendor) {
        const vendorIndex = btn.dataset.vendor;
        const date = btn.dataset.date;
        optimizeVendorSchedule(vendorIndex);
      }
    });
  });
}

function renderAIInsights() {
  if (!aiInsightsContainer) return;
  
  aiInsightsContainer.innerHTML = '';
  
  // 1. Payment concentration insight
  const concentration = checkPaymentConcentration();
  if (concentration.length > 0) {
    const worstDay = concentration.reduce((max, day) => 
      day.count > max.count ? day : max, concentration[0]);
    
    const insightElement = document.createElement('div');
    insightElement.innerHTML = `
      <p><strong>AI Insight:</strong> Your highest payment concentration is on ${worstDay.date} 
      with ${worstDay.count} payments totaling ${formatCurrency(worstDay.total)}.</p>
      <p>Consider spreading these payments to improve cash flow.</p>
    `;
    aiInsightsContainer.appendChild(insightElement);
  }

  // 2. Upcoming payments insight
  const upcoming = getUpcomingPayments();
  if (upcoming.length > 0) {
    const insightElement = document.createElement('div');
    insightElement.innerHTML = `
      <p><strong>AI Insight:</strong> You have ${upcoming.length} payments coming up in the next 7 days.</p>
    `;
    aiInsightsContainer.appendChild(insightElement);
  }

  // 3. Risk insight
  const risks = calculateRiskScores();
  if (risks.length > 0) {
    const highRisk = risks.filter(r => r.riskScore >= 7);
    if (highRisk.length > 0) {
      const insightElement = document.createElement('div');
      insightElement.innerHTML = `
        <p><strong>AI Insight:</strong> You have ${highRisk.length} high-risk vendors with risk scores ≥7.</p>
        <p>Consider prioritizing these payments or negotiating better terms.</p>
      `;
      aiInsightsContainer.appendChild(insightElement);
    }
  }
}

function checkPaymentConcentration() {
  const paymentDays = {};
  
  // Count payments per day
  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    const vendor = vendors[vendorIdx];
    if (!vendor) return;
    
    dates.forEach(date => {
      if (!paymentDays[date]) {
        paymentDays[date] = {
          count: 0,
          total: 0
        };
      }
      paymentDays[date].count++;
      paymentDays[date].total += vendor.amount;
    });
  });

  // Filter days with more than 2 payments
  return Object.entries(paymentDays)
    .filter(([_, day]) => day.count > 2)
    .map(([date, day]) => ({
      date,
      count: day.count,
      total: day.total
    }));
}

function checkPriorityVendors() {
  const today = new Date();
  const alerts = [];
  
  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    const vendor = vendors[vendorIdx];
    if (!vendor || vendor.priority !== 'High') return;
    
    dates.forEach(date => {
      const dueDate = new Date(date);
      const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= riskThreshold) {
        alerts.push({
          vendor,
          vendorIndex: vendorIdx,
          date,
          daysLeft
        });
      }
    });
  });
  
  return alerts;
}

function calculateRiskScores() {
  const today = new Date();
  const risks = [];
  
  vendors.forEach((vendor, index) => {
    if (!scheduled[index] || scheduled[index].length === 0) return;
    
    const nextPaymentDate = new Date(scheduled[index][0]);
    const daysUntilPayment = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
    
    let riskScore = 0;
    let reason = '';
    
    // High priority increases risk
    if (vendor.priority === 'High') {
      riskScore += 3;
      reason += 'high priority, ';
    }
    
    // Short payment terms increase risk
    if (vendor.terms < 15) {
      riskScore += 2;
      reason += 'short terms, ';
    }
    
    // Large amount increases risk
    if (vendor.amount > 10000) {
      riskScore += 2;
      reason += 'large amount, ';
    }
    
    // Approaching due date increases risk
    if (daysUntilPayment <= riskThreshold) {
      riskScore += 3;
      reason += 'approaching due date';
    }
    
    if (riskScore > 0) {
      risks.push({
        vendor,
        vendorIndex: index,
        riskScore: Math.min(riskScore, 10), // Cap at 10
        reason: reason.replace(/,\s*$/, '') // Remove trailing comma
      });
    }
  });
  
  return risks.sort((a, b) => b.riskScore - a.riskScore);
}

function suggestReschedule(date) {
  const vendorsOnDate = [];
  
  // Find all vendors scheduled on this date
  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    if (dates.includes(date)) {
      vendorsOnDate.push({
        vendor: vendors[vendorIdx],
        vendorIndex: vendorIdx
      });
    }
  });

  if (vendorsOnDate.length === 0) return;

  // Sort by amount (descending)
  vendorsOnDate.sort((a, b) => b.vendor.amount - a.vendor.amount);

  // Keep the largest payment on original date
  const keepVendor = vendorsOnDate.shift();

  // Reschedule others to subsequent days
  vendorsOnDate.forEach((vendor, i) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + i + 1);
    const newDateStr = newDate.toISOString().split('T')[0];

    // Remove from original date
    scheduled[vendor.vendorIndex] = scheduled[vendor.vendorIndex].filter(d => d !== date);
    
    // Add to new date
    if (!scheduled[vendor.vendorIndex].includes(newDateStr)) {
      scheduled[vendor.vendorIndex].push(newDateStr);
    }
  });

  saveScheduled();
  renderCalendar();
  generateAlerts();
  renderAIInsights();
  showNotification(`Rescheduled ${vendorsOnDate.length} payments from ${date}`);
}

function optimizeVendorSchedule(vendorIndex) {
  const vendor = vendors[vendorIndex];
  if (!vendor || !scheduled[vendorIndex] || scheduled[vendorIndex].length === 0) return;

  const currentDate = new Date(scheduled[vendorIndex][0]);
  const today = new Date();
  
  // If payment is within risk threshold, move it out
  if ((currentDate - today) / (1000 * 60 * 60 * 24) <= riskThreshold) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + riskThreshold);
    const newDateStr = newDate.toISOString().split('T')[0];

    scheduled[vendorIndex] = [newDateStr];
    saveScheduled();
    renderCalendar();
    generateAlerts();
    renderAIInsights();
    showNotification(`Rescheduled ${vendor.nickname} to ${newDateStr}`);
  }
}

aiScheduleBtn?.addEventListener('click', () => {
  // Find all high concentration days
  const concentration = checkPaymentConcentration();
  
  if (concentration.length === 0) {
    showNotification('No payment concentration issues found', 'info');
    return;
  }

  // Reschedule each concentrated day
  concentration.forEach(day => {
    suggestReschedule(day.date);
  });

  showNotification('Optimized payment schedule based on AI recommendations');
});

// Dashboard
function updateDashboard() {
  const total = vendors.reduce((sum, v) => sum + (v.amount || 0), 0);
  const upcoming = getUpcomingPayments().length;
  const highRisk = calculateRiskScores().filter(r => r.riskScore >= 7).length;

  document.getElementById('total-payments').textContent = formatCurrency(total);
  document.getElementById('upcoming-count').textContent = upcoming;
  document.getElementById('high-risk-count').textContent = highRisk;
}

function getUpcomingPayments() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcoming = [];
  
  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    const vendor = vendors[vendorIdx];
    if (!vendor) return;
    
    dates.forEach(date => {
      const dueDate = new Date(date);
      if (dueDate >= today && dueDate <= nextWeek) {
        upcoming.push({
          vendor,
          date
        });
      }
    });
  });
  
  return upcoming;
}

// Settings
saveSettingsBtn?.addEventListener('click', () => {
  currency = currencySelect.value;
  riskThreshold = parseInt(riskThresholdInput.value) || 7;
  
  localStorage.setItem('currency', currency);
  localStorage.setItem('riskThreshold', riskThreshold.toString());
  
  renderCalendar();
  updateDashboard();
  generateAlerts();
  renderAIInsights();
  showNotification('Settings saved successfully');
});

// Helper Functions
function formatCurrency(value) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency
  }).format(value);
}

function saveVendors() {
  localStorage.setItem('vendors', JSON.stringify(vendors));
}

function saveScheduled() {
  localStorage.setItem('scheduled', JSON.stringify(scheduled));
}

function showNotification(message, type = 'success') {
  if (!notification) return;
  
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Export
exportBtn?.addEventListener('click', exportCSV);

function exportCSV() {
  const csvHeader = `Vendor,Legal Name,Amount,Priority,Due Dates,Risk Score\n`;
  
  const csvBody = vendors.map((v, i) => {
    const dates = scheduled[i] ? scheduled[i].join('; ') : '';
    const risk = calculateRiskScores().find(r => r.vendorIndex === i);
    const riskScore = risk ? risk.riskScore : 0;
    
    return `"${v.nickname}","${v.legalName}",${v.amount} ${currency},"${v.priority}","${dates}",${riskScore}`;
  }).join('\n');
  
  const csv = csvHeader + csvBody;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `duebook_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('CSV exported successfully');
}