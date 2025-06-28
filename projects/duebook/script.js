
let data = JSON.parse(localStorage.getItem("vendors") || "[]");

document.getElementById("vendorForm").onsubmit = e => {
  e.preventDefault();
  const nickname = document.getElementById("nickname").value;
  const legalName = document.getElementById("legalName").value;
  const start = new Date(document.getElementById("startDate").value);
  const duration = parseInt(document.getElementById("duration").value);
  const amount = parseFloat(document.getElementById("amount").value);
  const priority = document.getElementById("priority").value;

  const dueDate = new Date(start.getTime());
  dueDate.setDate(start.getDate() + duration);

  data.push({ nickname, legalName, due: dueDate.toISOString().split("T")[0], amount, priority });
  localStorage.setItem("vendors", JSON.stringify(data));
  alert("Saved!");
  renderCalendar();
  renderInsights();
};

function renderCalendar() {
  const cal = document.getElementById("calendar-grid");
  cal.innerHTML = "";
  const dateMap = {};
  data.forEach(v => {
    if (!dateMap[v.due]) dateMap[v.due] = [];
    dateMap[v.due].push(v);
  });
  Object.entries(dateMap).forEach(([date, entries]) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${date}</strong><br/>` + entries.map((v, i) => `
      ${v.nickname}: ${v.amount} (${v.priority})
      <button class="remove-btn" onclick="removeVendor('${v.nickname}', '${v.due}')">Remove</button>
    `).join("<br/>");
    cal.appendChild(div);
  });
  checkStacking(dateMap);
}

function renderInsights() {
  const panel = document.getElementById("insights-content");
  let high = 0, med = 0, low = 0;
  let upcoming = [];
  const now = new Date();
  data.forEach(v => {
    if (v.priority === "High") high++;
    else if (v.priority === "Medium") med++;
    else low++;
    const d = new Date(v.due);
    if ((d - now) / (1000 * 3600 * 24) <= 7) upcoming.push(v);
  });
  panel.innerHTML = `
    <p>High Priority: ${high}</p>
    <p>Medium Priority: ${med}</p>
    <p>Low Priority: ${low}</p>
    <h3>Upcoming Payments (7 days):</h3>
    <ul>${upcoming.map(v => `<li>${v.nickname} on ${v.due}</li>`).join("")}</ul>
  `;
}

function exportCSV() {
  let csv = "Nickname,Legal Name,Due Date,Amount,Priority\n";
  data.forEach(v => {
    csv += `${v.nickname},${v.legalName},${v.due},${v.amount},${v.priority}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "duebook_payouts.csv";
  a.click();
}

function removeVendor(name, due) {
  data = data.filter(v => !(v.nickname === name && v.due === due));
  localStorage.setItem("vendors", JSON.stringify(data));
  renderCalendar();
  renderInsights();
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function checkStacking(map) {
  const alertBox = document.getElementById("alert-box");
  alertBox.innerHTML = "";
  Object.entries(map).forEach(([date, list]) => {
    if (list.length >= 3) {
      alertBox.innerHTML += `<p style="color:yellow">⚠ Multiple payments on ${date} (${list.length})</p>`;
    }
  });
}

renderCalendar();
renderInsights();
