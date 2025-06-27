
// Tab switching
document.querySelectorAll(".app-nav button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".app-nav button").forEach(btn => btn.classList.remove("active"));
    document.getElementById(button.dataset.tab).classList.add("active");
    button.classList.add("active");
  });
});

// Vendor Form Logic
const form = document.getElementById('vendor-form');
const list = document.getElementById('vendor-list');
let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');

function saveVendors() {
  localStorage.setItem('vendors', JSON.stringify(vendors));
}

function renderVendors() {
  list.innerHTML = '';
  vendors.forEach((v, i) => {
    const div = document.createElement('div');
    div.className = 'vendor-card';
    div.innerHTML = `
      <strong>${v.nickname}</strong> (${v.legalName})<br/>
      💰 ${v.amount} | ⏳ ${v.terms} days | 🗓 Due: ${v.dueDate}<br/>
      🔥 Priority: ${v.priority}
      <button onclick="removeVendor(${i})" style="float:right;">Remove</button>
    `;
    list.appendChild(div);
  });
}

function removeVendor(index) {
  vendors.splice(index, 1);
  saveVendors();
  renderVendors();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const nickname = document.getElementById('nickname').value;
  const legalName = document.getElementById('legalName').value;
  const amount = document.getElementById('amount').value;
  const terms = parseInt(document.getElementById('terms').value);
  const priority = document.getElementById('priority').value;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + terms);
  const formattedDue = dueDate.toISOString().split('T')[0];
  vendors.push({ nickname, legalName, amount, terms, priority, dueDate: formattedDue });
  saveVendors();
  renderVendors();
  form.reset();
});

renderVendors();
