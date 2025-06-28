
const tabs = document.querySelectorAll('nav button');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');

function renderVendors() {
  vendorList.innerHTML = '';
  vendors.forEach((v, i) => {
    const div = document.createElement('div');
    div.className = 'vendor-draggable';
    div.textContent = `${v.nickname} - ${v.amount}`;
    div.draggable = true;
    div.ondragstart = e => e.dataTransfer.setData('text/plain', i);
    vendorList.appendChild(div);
  });
}

vendorForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = {
    nickname: nickname.value,
    legalName: legalName.value,
    amount: amount.value,
    terms: terms.value,
    priority: priority.value
  };
  vendors.push(v);
  localStorage.setItem('vendors', JSON.stringify(vendors));
  vendorForm.reset();
  renderVendors();
  renderCalendar();
});

renderVendors();

const calendarGrid = document.getElementById('calendar-grid');
const getMonthDays = (year, month) => new Date(year, month + 1, 0).getDate();
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const daysInMonth = getMonthDays(year, month);
let scheduled = JSON.parse(localStorage.getItem('scheduled') || '{}');

function saveScheduled() {
  localStorage.setItem('scheduled', JSON.stringify(scheduled));
}

function renderCalendar() {
  calendarGrid.innerHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cell.dataset.date = date;
    cell.innerHTML = `<h4>${day}</h4>`;
    cell.ondragover = e => e.preventDefault();
    cell.ondrop = e => {
      const index = e.dataTransfer.getData('text/plain');
      if (!scheduled[index]) scheduled[index] = [];
      scheduled[index].push(cell.dataset.date);
      saveScheduled();
      renderCalendar();
    };
    calendarGrid.appendChild(cell);
  }

  vendors.forEach((v, i) => {
    if (scheduled[i]) {
      scheduled[i].forEach(date => {
        const cell = document.querySelector(`.calendar-day[data-date="${date}"]`);
        if (cell) {
          const el = document.createElement('div');
          el.className = 'vendor-draggable';
          el.textContent = `${v.nickname} - ${v.amount}`;
          el.draggable = true;
          el.ondragstart = e => e.dataTransfer.setData('text/plain', i);
          cell.appendChild(el);
          if (cell.children.length > 2) cell.classList.add('overlap');
        }
      });
    }
  });
}

renderCalendar();
