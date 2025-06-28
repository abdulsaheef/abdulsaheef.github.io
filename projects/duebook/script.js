const tabs = document.querySelectorAll('nav button');
const contents = document.querySelectorAll('.tab-content');
const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
const dashboardSummary = document.getElementById('dashboard-summary');
const calendarGrid = document.getElementById('calendar-grid');
const exportBtn = document.getElementById('export-btn');
const currencySelect = document.getElementById('currency-select');

// Initialize data from localStorage or defaults
let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
let scheduled = JSON.parse(localStorage.getItem('scheduled') || '{}');
let currency = localStorage.getItem('currency') || 'AED';

// --- Navigation ---
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active tab
    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => {
      c.classList.remove('active');
      c.hidden = true;
    });
    
    btn.classList.add('active');
    const content = document.getElementById(btn.dataset.tab);
    content.classList.add('active');
    content.hidden = false;
  });
});

// --- Currency Formatting ---
function formatCurrency(value) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency
  }).format(value);
}

// --- Data Persistence ---
function saveVendors() {
  localStorage.setItem('vendors', JSON.stringify(vendors));
}

function saveScheduled() {
  localStorage.setItem('scheduled', JSON.stringify(scheduled));
}

// --- Dashboard Functions ---
function updateDashboardSummary() {
  const total = vendors.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  if (dashboardSummary) {
    dashboardSummary.innerHTML = `<strong>Total Vendor Payments:</strong> ${formatCurrency(total)}`;
  }
}

// --- Vendor Management ---
function renderVendors() {
  if (!vendorList) return;
  
  vendorList.innerHTML = '';
  
  vendors.forEach((v, i) => {
    const vendorElement = document.createElement('div');
    vendorElement.className = `vendor-item vendor-${v.priority.toLowerCase()}`;
    vendorElement.innerHTML = `
      <div class="vendor-info">
        <span class="vendor-name">${v.nickname}</span>
        <span class="vendor-amount">${formatCurrency(v.amount)}</span>
      </div>
      <div class="vendor-actions">
        <button class="btn-remove" aria-label="Remove vendor">×</button>
      </div>
    `;
    
    vendorElement.draggable = true;
    vendorElement.dataset.vendorId = i;
    vendorElement.ondragstart = e => {
      e.dataTransfer.setData('text/plain', i);
      e.dataTransfer.effectAllowed = 'move';
    };

    const removeBtn = vendorElement.querySelector('.btn-remove');
    removeBtn.onclick = () => {
      if (confirm(`Remove ${v.nickname} from vendors?`)) {
        vendors.splice(i, 1);
        
        // Update scheduled payments to maintain correct indices
        const newScheduled = {};
        Object.entries(scheduled).forEach(([key, dates]) => {
          const idx = parseInt(key);
          if (idx === i) return;
          const newIndex = idx > i ? idx - 1 : idx;
          newScheduled[newIndex] = dates;
        });
        
        scheduled = newScheduled;
        saveVendors();
        saveScheduled();
        renderVendors();
        renderCalendar();
        updateDashboardSummary();
      }
    };
    
    vendorList.appendChild(vendorElement);
  });
}

// --- Vendor Form Submission ---
vendorForm?.addEventListener('submit', e => {
  e.preventDefault();
  
  const formData = new FormData(vendorForm);
  const vendor = {
    nickname: formData.get('nickname').trim(),
    legalName: formData.get('legalName').trim(),
    amount: parseFloat(formData.get('amount')),
    terms: parseInt(formData.get('terms')),
    priority: formData.get('priority')
  };
  
  // Validate input
  if (!vendor.nickname || !vendor.legalName || isNaN(vendor.amount) {
    alert('Please fill all required fields with valid data');
    return;
  }
  
  vendors.push(vendor);
  saveVendors();
  
  // Calculate initial due date
  const today = new Date();
  const dueDate = new Date(today.getTime() + vendor.terms * 86400000)
    .toISOString().split('T')[0];
  
  const vendorIndex = vendors.length - 1;
  if (!scheduled[vendorIndex]) scheduled[vendorIndex] = [];
  if (!scheduled[vendorIndex].includes(dueDate)) {
    scheduled[vendorIndex].push(dueDate);
  }
  
  saveScheduled();
  vendorForm.reset();
  renderVendors();
  renderCalendar();
  updateDashboardSummary();
});

// --- Calendar Functions ---
function renderCalendar() {
  if (!calendarGrid) return;
  
  calendarGrid.innerHTML = '';
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Create calendar header
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const header = document.createElement('div');
  header.className = 'calendar-header';
  header.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarGrid.appendChild(header);
  
  // Create calendar days grid
  const daysGrid = document.createElement('div');
  daysGrid.className = 'calendar-days-grid';
  
  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const cell = document.createElement('div');
    cell.className = `calendar-day ${isWeekend ? 'weekend' : ''}`;
    cell.dataset.date = dateStr;
    cell.innerHTML = `<div class="day-number">${day}</div>`;
    
    // Make cells droppable
    cell.ondragover = e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cell.classList.add('drop-target');
    };
    
    cell.ondragleave = () => {
      cell.classList.remove('drop-target');
    };
    
    cell.ondrop = e => {
      e.preventDefault();
      cell.classList.remove('drop-target');
      
      const vendorIndex = e.dataTransfer.getData('text/plain');
      if (!vendors[vendorIndex]) return;
      
      if (!scheduled[vendorIndex]) scheduled[vendorIndex] = [];
      if (!scheduled[vendorIndex].includes(dateStr)) {
        scheduled[vendorIndex].push(dateStr);
        saveScheduled();
        renderCalendar();
      }
    };
    
    daysGrid.appendChild(cell);
  }
  
  calendarGrid.appendChild(daysGrid);
  
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
          <span class="payment-name">${vendor.nickname}</span>
          <span class="payment-amount">${formatCurrency(vendor.amount)}</span>
          <button class="btn-remove-payment" aria-label="Remove payment">×</button>
        `;
        
        paymentElement.draggable = true;
        paymentElement.dataset.vendorId = vendorIdx;
        paymentElement.ondragstart = e => {
          e.dataTransfer.setData('text/plain', vendorIdx);
          e.dataTransfer.effectAllowed = 'move';
        };
        
        const removeBtn = paymentElement.querySelector('.btn-remove-payment');
        removeBtn.onclick = e => {
          e.stopPropagation();
          scheduled[vendorIdx] = scheduled[vendorIdx].filter(d => d !== date);
          saveScheduled();
          renderCalendar();
        };
        
        cell.appendChild(paymentElement);
        
        // Mark cells with multiple payments
        if (cell.querySelectorAll('.calendar-payment').length > 2) {
          cell.classList.add('overlap');
        }
      }
    });
  });
}

// --- Export Functionality ---
function exportCSV() {
  const csvHeader = `Nickname,Legal Name,Amount (${currency}),Terms (days),Priority,Due Dates\n`;
  
  const csvBody = vendors.map((v, i) => {
    const dates = scheduled[i] ? scheduled[i].join('; ') : '';
    return `"${v.nickname}","${v.legalName}",${v.amount},${v.terms},"${v.priority}","${dates}"`;
  }).join('\n');
  
  const csv = csvHeader + csvBody;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `duebook_export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

exportBtn?.addEventListener('click', exportCSV);

// --- Currency Management ---
const currencies = [
  // Major currencies
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  
  // Middle East
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "OMR", name: "Omani Rial" },
  
  // Other popular currencies
  { code: "INR", name: "Indian Rupee" },
  { code: "KRW", name: "South Korean Won" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NZD", name: "New Zealand Dollar" }
];

// Initialize currency selector
if (currencySelect) {
  currencies.forEach(c => {
    const option = document.createElement('option');
    option.value = c.code;
    option.textContent = `${c.code} - ${c.name}`;
    currencySelect.appendChild(option);
  });
  
  currencySelect.value = currency;
  
  currencySelect.addEventListener('change', () => {
    currency = currencySelect.value;
    localStorage.setItem('currency', currency);
    updateDashboardSummary();
    renderVendors();
    renderCalendar();
  });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Show only the active tab content
  contents.forEach(c => {
    if (!c.classList.contains('active')) {
      c.hidden = true;
    }
  });
  
  renderVendors();
  renderCalendar();
  updateDashboardSummary();
  
  // Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
});