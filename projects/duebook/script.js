
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
let scheduled = JSON.parse(localStorage.getItem('scheduled') || '{}');

function saveScheduled() {
  localStorage.setItem('scheduled', JSON.stringify(scheduled));
}

function updateDashboardSummary() {
  const section = document.querySelector('#dashboard');
  let total = vendors.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  section.innerHTML = `<h2>Welcome to DueBook</h2>
  <p>Your smart vendor payment planner.</p>
  <div style="margin-top:1rem; background: rgba(255,255,255,0.1); padding:1rem; border-radius: 10px;">
    <strong>Total Vendor Payments:</strong> AED ${total.toFixed(2)}
  </div>`;
}

function renderVendors() {
  vendorList.innerHTML = '';
  vendors.forEach((v, i) => {
    const div = document.createElement('div');
    div.className = 'vendor-draggable';
    div.textContent = `${v.nickname} - AED ${v.amount}`;
    div.draggable = true;
    div.ondragstart = e => e.dataTransfer.setData('text/plain', i);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "×";
    removeBtn.onclick = () => {
      if (confirm("Remove this vendor?")) {
        vendors.splice(i, 1);
        localStorage.setItem("vendors", JSON.stringify(vendors));
        delete scheduled[i];
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
  updateDashboardSummary();
});

function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.innerHTML = '';
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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

renderVendors();
renderCalendar();
updateDashboardSummary();
