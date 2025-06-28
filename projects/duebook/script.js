const tabs = document.querySelectorAll('nav button');
const contents = document.querySelectorAll('.tab-content');
const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
const dashboardSummary = document.getElementById('dashboard-summary');
const calendarGrid = document.getElementById('calendar-grid');
const exportBtn = document.getElementById('export-btn');
const currencySelect = document.getElementById('currency-select');

let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
let scheduled = JSON.parse(localStorage.getItem('scheduled') || '{}');
let currency = localStorage.getItem('currency') || 'AED';

// --- Navigation ---
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// --- Format Currency ---
function formatCurrency(value) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency
  }).format(value);
}

// --- Save Functions ---
function saveVendors() {
  localStorage.setItem('vendors', JSON.stringify(vendors));
}

function saveScheduled() {
  localStorage.setItem('scheduled', JSON.stringify(scheduled));
}

// --- Dashboard ---
function updateDashboardSummary() {
  const total = vendors.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  const currency = localStorage.getItem('currency') || 'AED';
  if (dashboardSummary)
    dashboardSummary.innerHTML = `<strong>Total Vendor Payments:</strong> ${formatCurrency(total)}`;
}

// --- Render Vendors ---
function renderVendors() {
  vendorList.innerHTML = '';
  vendors.forEach((v, i) => {
    const div = document.createElement('div');
    div.className = `vendor-draggable ${v.priority.toLowerCase()}`;
    div.textContent = `${v.nickname} - ${formatCurrency(v.amount)}`;
    div.draggable = true;
    div.ondragstart = e => e.dataTransfer.setData('text/plain', i);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "×";
    removeBtn.onclick = () => {
      if (confirm("Remove this vendor?")) {
        vendors.splice(i, 1);
        let newScheduled = {};
        Object.entries(scheduled).forEach(([key, dates]) => {
          let idx = parseInt(key);
          if (idx === i) return;
          let newIndex = idx > i ? idx - 1 : idx;
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
    div.appendChild(removeBtn);
    vendorList.appendChild(div);
  });
}

// --- Submit Form ---
vendorForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = {
    nickname: nickname.value.trim(),
    legalName: legalName.value.trim(),
    amount: parseFloat(amount.value),
    terms: parseInt(terms.value),
    priority: priority.value
  };
  vendors.push(v);
  saveVendors();

  const today = new Date();
  const dueDate = new Date(today.getTime() + v.terms * 86400000).toISOString().split('T')[0];
  const index = vendors.length - 1;
  if (!scheduled[index]) scheduled[index] = [];
  if (!scheduled[index].includes(dueDate)) {
    scheduled[index].push(dueDate);
  }
  saveScheduled();

  vendorForm.reset();
  renderVendors();
  renderCalendar();
  updateDashboardSummary();
});

// --- Render Calendar ---
function renderCalendar() {
  calendarGrid.innerHTML = '';
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.dataset.date = dateStr;
    cell.innerHTML = `<h4>${day}</h4>`;

    cell.ondragover = e => e.preventDefault();
    cell.ondrop = e => {
      const index = e.dataTransfer.getData('text/plain');
      if (!vendors[index]) return;
      if (!scheduled[index]) scheduled[index] = [];
      if (!scheduled[index].includes(dateStr)) {
        scheduled[index].push(dateStr);
      }
      saveScheduled();
      renderCalendar();
    };

    calendarGrid.appendChild(cell);
  }

  Object.entries(scheduled).forEach(([vendorIdx, dates]) => {
    const vendor = vendors[vendorIdx];
    if (!vendor) return;

    dates.forEach(date => {
      const cell = calendarGrid.querySelector(`.calendar-day[data-date="${date}"]`);
      if (cell) {
        const el = document.createElement('div');
        el.className = `vendor-draggable ${vendor.priority.toLowerCase()}`;
        el.textContent = `${vendor.nickname} - ${formatCurrency(vendor.amount)}`;
        el.draggable = true;
        el.ondragstart = e => e.dataTransfer.setData('text/plain', vendorIdx);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.onclick = ev => {
          ev.stopPropagation();
          scheduled[vendorIdx] = scheduled[vendorIdx].filter(d => d !== date);
          saveScheduled();
          renderCalendar();
        };

        el.appendChild(removeBtn);
        cell.appendChild(el);
        if (cell.querySelectorAll('.vendor-draggable').length > 2) {
          cell.classList.add('overlap');
        } else {
          cell.classList.remove('overlap');
        }
      }
    });
  });
}

// --- Export CSV ---
function exportCSV() {
  const csvHeader = `Nickname,Legal Name,Amount (${currency}),Terms (days),Priority,Due Dates\n`;
  let csvBody = vendors.map((v, i) => {
    const dates = scheduled[i] ? scheduled[i].join('; ') : '';
    return `"${v.nickname}","${v.legalName}",${v.amount},${v.terms},"${v.priority}","${dates}"`;
  }).join('\n');
  
  const csv = csvHeader + csvBody;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `duebook_schedule_${currency}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener('click', exportCSV);

// --- Currency List (Extendable) ---
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

if (currencySelect) {
  currencies.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = `${c.code} - ${c.name}`;
    currencySelect.appendChild(opt);
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

// --- Initialize ---
renderVendors();
renderCalendar();
updateDashboardSummary();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(() => {
    console.log('Service Worker registered');
  });
}