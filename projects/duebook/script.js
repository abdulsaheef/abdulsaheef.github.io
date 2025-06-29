// DOM Elements
const tabs = document.querySelectorAll('nav button');
const contents = document.querySelectorAll('.tab-content');
const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
const calendarGrid = document.getElementById('calendar-views');
const exportBtn = document.getElementById('export-btn');
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
let currentView = "month";
let currentDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCurrencySelector();
  renderVendors();
  initSuperCalendar();
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
      
      if (btn.dataset.tab === 'calendar') {
        renderCalendar();
      }
    });
  });
}

// Currency
function initCurrencySelector() {
  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "AED", name: "UAE Dirham" },
    { code: "INR", name: "Indian Rupee" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "AUD", name: "Australian Dollar" }
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

/* ================== SUPER CALENDAR ================== */
function renderCalendar() {
  const calendar = document.getElementById('calendar-views');
  if (!calendar) return;
  
  calendar.innerHTML = '';
  document.getElementById('current-month').textContent = 
    currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  if (currentView === "month") {
    renderMonthView();
  } else {
    renderTimelineView();
  }
}

function renderMonthView() {
  const calendar = document.getElementById('calendar-views');
  const firstDay = new Date(
    currentDate.getFullYear(), 
    currentDate.getMonth(), 
    1
  ).getDay();
  
  const daysInMonth = new Date(
    currentDate.getFullYear(), 
    currentDate.getMonth() + 1, 
    0
  ).getDate();
  
  const heatmapData = calculatePaymentHeatmap();
  
  let html = `
    <div class="month-grid" 
         style="--rows: ${Math.ceil((daysInMonth + firstDay) / 7)}">
  `;
  
  // Day headers
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    html += `<div class="day-header">${day}</div>`;
  });
  
  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day empty"></div>`;
  }
  
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    const heatValue = heatmapData[dateString] || 0;
    const isToday = date.toDateString() === new Date().toDateString();
    
    html += `
      <div class="day heat-${Math.min(Math.floor(heatValue / 3), 4)}" 
           data-date="${dateString}"
           draggable="false">
        <div class="day-number">${day}</div>
        ${renderPaymentsForDate(dateString)}
        ${isToday ? '<div class="today-marker"></div>' : ''}
      </div>`;
  }
  
  calendar.innerHTML = html + '</div>';
  initDayInteractions();
}

function renderTimelineView() {
  const calendar = document.getElementById('calendar-views');
  const payments = getAllPaymentsSorted();
  
  let html = `<div class="timeline-view">`;
  
  payments.forEach(payment => {
    const paymentDate = new Date(payment.date);
    const isOverdue = paymentDate < new Date() && paymentDate.toDateString() !== new Date().toDateString();
    
    html += `
      <div class="timeline-item" data-date="${payment.date}">
        <div class="timeline-badge ${payment.vendor.priority.toLowerCase()}"></div>
        <div class="timeline-content">
          <h4>${payment.vendor.nickname}</h4>
          <p>${formatCurrency(payment.vendor.amount)}</p>
          <small>${paymentDate.toLocaleDateString()}</small>
          ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
        </div>
        <div class="timeline-actions">
          <button class="btn-reschedule" data-id="${payment.vendorIndex}">↻ Reschedule</button>
        </div>
      </div>`;
  });
  
  calendar.innerHTML = html + '</div>';
  
  // Add reschedule event listeners
  document.querySelectorAll('.btn-reschedule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const vendorIndex = e.target.dataset.id;
      optimizeVendorSchedule(vendorIndex);
    });
  });
}

function calculatePaymentHeatmap() {
  const heatmap = {};
  Object.entries(scheduled).forEach(([vendorIndex, dates]) => {
    const vendor = vendors[vendorIndex];
    dates.forEach(date => {
      heatmap[date] = (heatmap[date] || 0) + vendor.amount;
    });
  });
  return heatmap;
}

function getAllPaymentsSorted() {
  const allPayments = [];
  Object.entries(scheduled).forEach(([vendorIndex, dates]) => {
    const vendor = vendors[vendorIndex];
    dates.forEach(date => {
      allPayments.push({
        date,
        vendor,
        vendorIndex
      });
    });
  });
  return allPayments.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderPaymentsForDate(dateString) {
  let paymentsHTML = '';
  Object.entries(scheduled).forEach(([vendorIndex, dates]) => {
    if (dates.includes(dateString)) {
      const vendor = vendors[vendorIndex];
      paymentsHTML += `
        <div class="payment-entry ${vendor.priority.toLowerCase()}" 
             draggable="true"
             data-vendor-index="${vendorIndex}"
             data-date="${dateString}">
          ${vendor.nickname} - ${formatCurrency(vendor.amount)}
        </div>`;
    }
  });
  return paymentsHTML;
}

function initDayInteractions() {
  // Make days droppable
  document.querySelectorAll('.day').forEach(day => {
    day.addEventListener('dragover', e => {
      e.preventDefault();
      day.classList.add('drop-target');
    });
    
    day.addEventListener('dragleave', () => {
      day.classList.remove('drop-target');
    });
    
    day.addEventListener('drop', e => {
      e.preventDefault();
      day.classList.remove('drop-target');
      const vendorIndex = e.dataTransfer.getData('text/plain');
      const date = day.dataset.date;
      if (vendorIndex && date) {
        schedulePayment(vendorIndex, date);
      }
    });
  });

  // Make payments draggable
  document.querySelectorAll('.payment-entry').forEach(payment => {
    payment.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', payment.dataset.vendorIndex);
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

function autoSchedulePayments() {
  const paymentDays = {};
  
  // Group payments by date
  Object.entries(scheduled).forEach(([vendorIndex, dates]) => {
    dates.forEach(date => {
      if (!paymentDays[date]) paymentDays[date] = [];
      paymentDays[date].push({
        vendorIndex,
        amount: vendors[vendorIndex].amount,
        priority: vendors[vendorIndex].priority
      });
    });
  });
  
  // Reschedule conflicts
  Object.entries(paymentDays).forEach(([date, payments]) => {
    if (payments.length > 2) {
      // Sort by priority and amount
      payments.sort((a, b) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority] || b.amount - a.amount;
      });
      
      // Keep top 2 payments on original date
      const toReschedule = payments.slice(2);
      
      toReschedule.forEach((payment, i) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + Math.floor(i / 2) + 1);
        const newDateStr = newDate.toISOString().split('T')[0];
        
        // Remove from original date
        scheduled[payment.vendorIndex] = scheduled[payment.vendorIndex].filter(d => d !== date);
        
        // Add to new date
        if (!scheduled[payment.vendorIndex].includes(newDateStr)) {
          scheduled[payment.vendorIndex].push(newDateStr);
        }
      });
    }
  });
  
  saveScheduled();
  renderCalendar();
  showNotification('Payments optimally scheduled! ✨');
}

function initSuperCalendar() {
  renderCalendar();
  
  // Event listeners
  document.getElementById('view-toggle').addEventListener('click', toggleView);
  document.getElementById('today-btn').addEventListener('click', goToToday);
  document.getElementById('schedule-all').addEventListener('click', autoSchedulePayments);
  
  // Navigation
  document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
  document.getElementById('prev-year').addEventListener('click', () => navigateMonth(-12));
  document.getElementById('next-year').addEventListener('click', () => navigateMonth(12));
  
  // Time filters
  document.querySelectorAll('.time-filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      highlightPayments(filter);
    });
  });
}

function toggleView() {
  currentView = currentView === "month" ? "list" : "month";
  document.getElementById('view-toggle').textContent = 
    currentView === "month" ? "🌗 List View" : "📅 Month View";
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  renderCalendar();
}

function navigateMonth(offset) {
  currentDate.setMonth(currentDate.getMonth() + offset);
  renderCalendar();
}

function highlightPayments(filter) {
  const today = new Date().toISOString().split('T')[0];
  
  if (currentView === "month") {
    document.querySelectorAll('.payment-entry').forEach(entry => {
      const date = entry.closest('.day').dataset.date;
      entry.style.opacity = 1;
      
      if (filter === 'upcoming' && date < today) {
        entry.style.opacity = 0.3;
      } else if (filter === 'overdue' && date >= today) {
        entry.style.opacity = 0.3;
      }
    });
  } else {
    document.querySelectorAll('.timeline-item').forEach(item => {
      const date = item.dataset.date;
      item.style.opacity = 1;
      
      if (filter === 'upcoming' && date < today) {
        item.style.opacity = 0.3;
      } else if (filter === 'overdue' && date >= today) {
        item.style.opacity = 0.3;
      }
    });
  }
}

// [Rest of your existing functions (updateDashboard, generateAlerts, etc.)]

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