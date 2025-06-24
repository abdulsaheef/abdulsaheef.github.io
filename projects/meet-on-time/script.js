const DateTime = luxon.DateTime;
let cities = JSON.parse(localStorage.getItem('mot_cities')) || [
  { name: "New York", zone: "America/New_York" },
  { name: "London", zone: "Europe/London" },
  { name: "Dubai", zone: "Asia/Dubai" }
];
let workingRanges = [];

const cityInput = document.getElementById("city-input");
const addCityBtn = document.getElementById("add-city-btn");
const rowsContainer = document.getElementById("rows-container");
const shareSummary = document.getElementById("share-summary");

// Local timezone display
document.getElementById("local-zone").textContent =
  "Your Timezone: " + Intl.DateTimeFormat().resolvedOptions().timeZone;

// Resolve zone from friendly name
function resolveZone(input) {
  const val = input.trim().toLowerCase();
  const zones = Intl.supportedValuesOf('timeZone');
  if (zones.includes(input)) return input;
  const found = zones.find(z => z.split('/').pop().replace('_',' ').toLowerCase() === val);
  return found;
}

function createTimelineRow(city) {
  const row = document.createElement('div');
  row.className = 'timeline-row';
  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  row.appendChild(cityName);

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.className = 'remove-city';
  removeBtn.onclick = () => {
    cities = cities.filter(c => c !== city);
    saveCities();
    renderAll();
  };
  row.appendChild(removeBtn);

  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';
  const utcWorking = [];
  for (let h = 0; h < 24; h++) {
    const utcTime = DateTime.utc().set({ hour: h });
    const local = utcTime.setZone(city.zone);
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = local.toFormat('HH');
    if (local.hour >= 9 && local.hour < 17) {
      cell.classList.add('working-hour');
      utcWorking.push(h);
    }
    if (h === DateTime.utc().hour) {
      cell.classList.add('current-hour');
    }
    timeline.appendChild(cell);
  }
  row.appendChild(timeline);
  rowsContainer.appendChild(row);
  workingRanges.push(utcWorking);
}

function renderAll() {
  rowsContainer.innerHTML = '';
  workingRanges = [];
  cities.forEach(createTimelineRow);
  highlightOverlap();
  saveCities();
}

function highlightOverlap() {
  const overlap = workingRanges.reduce((a, b) => a.filter(x => b.includes(x)), workingRanges[0] || []);
  document.querySelectorAll(".timeline-row").forEach(row => {
    const cells = row.querySelectorAll(".cell");
    overlap.forEach(hour => {
      if (cells[hour]) {
        cells[hour].classList.add("overlap-hour");
      }
    });
  });

  if (overlap.length) {
    const best = overlap[Math.floor(overlap.length / 2)];
    const start = DateTime.utc().set({ hour: best });
    const end = start.plus({ hours: 1 });
    let text = `Meet on Time - Best Overlap (UTC ${best}:00 to ${best + 1}:00)

`;
    cities.forEach(c => {
      text += `${c.name.padEnd(15)}: ${start.setZone(c.zone).toFormat('hh:mm a')} to ${end.setZone(c.zone).toFormat('hh:mm a')}
`;
    });
    shareSummary.innerHTML = `<pre>${text}</pre>`;
  } else {
    shareSummary.textContent = 'No overlapping working hours.';
  }
}

function saveCities() {
  localStorage.setItem('mot_cities', JSON.stringify(cities));
}

addCityBtn.addEventListener("click", () => {
  const cityName = cityInput.value.trim();
  const zone = resolveZone(cityName);
  if (!zone) return alert("City not recognized.");
  if (cities.find(c => c.zone === zone)) return alert("City already added.");
  const newCity = { name: cityName, zone };
  cities.push(newCity);
  renderAll();
  cityInput.value = "";
});

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Reset all cities to default?")) {
    localStorage.removeItem("mot_cities");
    window.location.reload();
  }
});

document.getElementById("save-btn").addEventListener("click", () => {
  const blob = new Blob([shareSummary.innerText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "MeetOnTime_Summary.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.has("cities")) {
    cities = params.get("cities").split(",").map(z => ({ name: z.split("/").pop().replace("_", " "), zone: z }));
  }
  renderAll();
})();
