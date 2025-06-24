const DateTime = luxon.DateTime;

// Load saved cities or defaults
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

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Reset all cities to default?")) {
    localStorage.removeItem("mot_cities");
    window.location.reload();
  }
});

document.getElementById("save-btn").addEventListener("click", () => {
  const blob = new Blob([document.getElementById("share-summary").innerText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "MeetOnTime_Summary.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

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

// Create a timeline row with removal and rename
function createTimelineRow(city) {
  const row = document.createElement('div');
  row.className = 'timeline-row city-row';
  // City name editable
  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  cityName.contentEditable = true;
  cityName.addEventListener('blur', () => {
    city.name = cityName.textContent.trim();
    saveCities();
    renderAll();
  });
  row.appendChild(cityName);
  // Remove button
  const removeBtn = document.createElement('button');
removeBtn.textContent = 'Remove';
removeBtn.className = 'remove-city';
removeBtn.onclick = () => {
  cities = cities.filter(c => c !== city);
  saveCities();
  renderAll();
};
row.appendChild(removeBtn);
  // Timeline cells
  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';
  const utcWorking = [];
  const nowUTC = DateTime.utc();
  for (let h = 0; h < 24; h++) {
    const utcTime = nowUTC.set({ hour: h });
    const local = utcTime.setZone(city.zone);
    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = local.toFormat('HH');
    if (local.hour >= 9 && local.hour < 17) {
      hourBox.classList.add('working-hour');
      utcWorking.push(h);
    }
    if (h === nowUTC.hour) hourBox.classList.add('current-hour');
    timeline.appendChild(hourBox);
  }
  row.appendChild(timeline);
  rowsContainer.appendChild(row);
  workingRanges.push(utcWorking);
}

// Highlight overlap and show summary
function renderAll() {
  rowsContainer.innerHTML = '';
  workingRanges = [];
  cities.forEach(city => createTimelineRow(city));
  // overlap
  const overlap = workingRanges.reduce((a,b)=>a.filter(x=>b.includes(x)), workingRanges[0]||[]);
  document.querySelectorAll('.timeline-row').forEach(row=>{
    const cells = row.querySelectorAll('.cell');
    overlap.forEach(h=>cells[h]?.classList.add('overlap-hour'));
  });
  // summary
  if (overlap.length) {
    const best = overlap[Math.floor(overlap.length/2)];
    const start = DateTime.utc().set({hour:best,minute:0});
    const end = DateTime.utc().set({hour:best+1,minute:0});
    let text = `🗓 Best Overlap: ${start.toFormat('HH:mm')}–${end.toFormat('HH:mm')} UTC`;
    cities.forEach(c=>{ text += `\n${c.name}: `+ DateTime.utc().set({hour:best}).setZone(c.zone).toFormat('hh:mm a'); });
    shareSummary.innerHTML = `<pre>${text}</pre><button id="copy-summary">Copy Summary</button><button id="copy-link">Copy Link</button>`;
    document.getElementById('copy-summary').onclick = ()=>{navigator.clipboard.writeText(text);alert('Summary copied');};
    const url = new URL(window.location);
    url.searchParams.set('cities', cities.map(c=>c.zone).join(','));
    document.getElementById('copy-link').onclick = ()=>{navigator.clipboard.writeText(url.toString());alert('Link copied');};
  } else {
    shareSummary.textContent = 'No common working hours';
  }
}

// Save/load cities
function saveCities() {
  localStorage.setItem('mot_cities', JSON.stringify(cities));
}

// Add city
addCityBtn.addEventListener('click', ()=>{
  const inputVal = cityInput.value.trim();
  const zone = resolveZone(inputVal);
  if (!zone) return alert('City not recognized. Please select from the list.');
  if (cities.some(c=>c.zone===zone)) return alert('Already added');
  const friendly = zone.split('/').pop().replace('_',' ');
  const city = {name: friendly, zone};
  cities.push(city);
  saveCities();
  renderAll();
  cityInput.value='';
});

// Load from URL and render
(function(){
  const params = new URLSearchParams(window.location.search);
  if (params.has('cities')) {
    cities = params.get('cities').split(',').map(z=>({name:z.split('/').pop().replace('_',' '),zone:z}));
  }
  renderAll();
})();
