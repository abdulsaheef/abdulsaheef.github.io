
const DateTime = luxon.DateTime;
const cities = [
  { name: "New York", zone: "America/New_York" },
  { name: "London", zone: "Europe/London" },
  { name: "Dubai", zone: "Asia/Dubai" }
];
let workingRanges = [];

const cityInput = document.getElementById("city-input");
const addCityBtn = document.getElementById("add-city-btn");
const rowsContainer = document.getElementById('rows-container');
const currentUTCHour = DateTime.utc().hour;

const timeZoneMap = {
  "new york": "America/New_York",
  "london": "Europe/London",
  "dubai": "Asia/Dubai",
  "tokyo": "Asia/Tokyo",
  "delhi": "Asia/Kolkata",
  "sydney": "Australia/Sydney",
  "berlin": "Europe/Berlin",
  "toronto": "America/Toronto",
  "moscow": "Europe/Moscow",
  "singapore": "Asia/Singapore",
  "san francisco": "America/Los_Angeles",
  "chicago": "America/Chicago"
};

function createTimelineRow(city) {
  const row = document.createElement('div');
  row.className = 'timeline-row';
  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  row.appendChild(cityName);

  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';
  const utcWorkingHours = [];

  for (let h = 0; h < 24; h++) {
    const utcTime = DateTime.utc().set({ hour: h });
    const localTime = utcTime.setZone(city.zone);
    const hourNum = localTime.hour;

    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = localTime.toFormat("HH");

    if (hourNum >= 9 && hourNum < 17) {
      hourBox.classList.add('working-hour');
      utcWorkingHours.push(h);
    }
    if (h === currentUTCHour) {
      hourBox.classList.add('current-hour');
    }
    timeline.appendChild(hourBox);
  }

  row.appendChild(timeline);
  rowsContainer.appendChild(row);
  workingRanges.push(utcWorkingHours);
}

cities.forEach(createTimelineRow);

function findOverlap(ranges) {
  return ranges.reduce((a, b) => a.filter(c => b.includes(c)));
}

function highlightOverlap() {
  const overlap = findOverlap(workingRanges);
  document.querySelectorAll(".timeline-row").forEach(row => {
    const cells = row.querySelectorAll(".cell");
    overlap.forEach(hour => {
      if (cells[hour]) {
        cells[hour].classList.add("overlap-hour");
      }
    });
  });
}

highlightOverlap();

addCityBtn.addEventListener("click", () => {
  const cityName = cityInput.value.trim().toLowerCase();
  if (!timeZoneMap[cityName]) {
    alert("City not recognized or supported.");
    return;
  }
  const cityZone = timeZoneMap[cityName];
  if (cities.find(c => c.zone === cityZone)) {
    alert("City already added.");
    return;
  }
  const city = { name: cityInput.value.trim(), zone: cityZone };
  cities.push(city);
  createTimelineRow(city);
  highlightOverlap();
  cityInput.value = "";
});

// Theme toggle
const toggle = document.getElementById("mode-toggle");
toggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
});
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

// Local timezone display
document.getElementById("local-zone").textContent =
  "Your Timezone: " + Intl.DateTimeFormat().resolvedOptions().timeZone;

const hoursPanel = document.getElementById("custom-hours-panel");

function createWorkingHourConfig(city) {
  const wrapper = document.createElement("div");
  wrapper.className = "working-hour-config";
  wrapper.innerHTML = \`
    <strong>\${city.name}</strong>:
    Start <select class="start-hour">\${generateHourOptions()}</select>
    End <select class="end-hour">\${generateHourOptions(9, 18)}</select>
  \`;

  wrapper.querySelector(".start-hour").addEventListener("change", () => updateTimelines());
  wrapper.querySelector(".end-hour").addEventListener("change", () => updateTimelines());

  city.configElement = wrapper;
  hoursPanel.appendChild(wrapper);
}

function generateHourOptions(start=0, end=24) {
  let options = "";
  for (let i = start; i <= end; i++) {
    options += \`<option value="\${i}">\${i.toString().padStart(2, "0")}</option>\`;
  }
  return options;
}

function getCustomHours(city) {
  if (!city.configElement) return [9, 17];
  const start = parseInt(city.configElement.querySelector(".start-hour").value);
  const end = parseInt(city.configElement.querySelector(".end-hour").value);
  return [start, end];
}

function renderCityTimelineWithCustomHours(city) {
  const nowUTC = luxon.DateTime.utc();
  const row = document.createElement('div');
  row.className = 'timeline-row';

  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  row.appendChild(cityName);

  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';
  const utcWorkingHours = [];
  const [startH, endH] = getCustomHours(city);

  for (let h = 0; h < 24; h++) {
    const utcTime = nowUTC.set({ hour: h, minute: 0 });
    const localTime = utcTime.setZone(city.zone);
    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = localTime.toFormat("HH");

    const hourNum = localTime.hour;
    if (hourNum >= startH && hourNum < endH) {
      hourBox.classList.add('working-hour');
      utcWorkingHours.push(h);
    }

    if (hourNum === localTime.hour && h === nowUTC.hour) {
      hourBox.classList.add('current-hour');
    }

    timeline.appendChild(hourBox);
  }

  row.appendChild(timeline);
  document.getElementById("rows-container").appendChild(row);
  workingRanges.push(utcWorkingHours);
}

function updateTimelines() {
  document.getElementById("rows-container").innerHTML = "";
  workingRanges = [];
  cities.forEach(renderCityTimelineWithCustomHours);
  highlightOverlap();
}

// Update addCity function to include working hour UI
addCityBtn.addEventListener("click", () => {
  const cityName = cityInput.value.trim().toLowerCase();
  if (!timeZoneMap[cityName]) {
    alert("City not recognized or supported.");
    return;
  }
  const cityZone = timeZoneMap[cityName];
  if (cities.find(c => c.zone === cityZone)) {
    alert("City already added.");
    return;
  }
  const city = { name: cityInput.value.trim(), zone: cityZone };
  cities.push(city);
  createWorkingHourConfig(city);
  renderCityTimelineWithCustomHours(city);
  highlightOverlap();
  cityInput.value = "";
});

// Set config panel for existing cities
cities.forEach(createWorkingHourConfig);
updateTimelines();

let selectedDate = luxon.DateTime.utc().startOf("day");

flatpickr("#meeting-date", {
  defaultDate: new Date(),
  onChange: function(selectedDates) {
    selectedDate = luxon.DateTime.fromJSDate(selectedDates[0]).startOf("day");
    updateTimelines();
  }
});

function renderCityTimelineWithCustomHours(city) {
  const row = document.createElement('div');
  row.className = 'timeline-row';
  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  row.appendChild(cityName);

  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';
  const utcWorkingHours = [];
  const [startH, endH] = getCustomHours(city);

  for (let h = 0; h < 24; h++) {
    const utcTime = selectedDate.set({ hour: h });
    const localTime = utcTime.setZone(city.zone);
    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = localTime.toFormat("HH");

    const hourNum = localTime.hour;
    if (hourNum >= startH && hourNum < endH) {
      hourBox.classList.add('working-hour');
      utcWorkingHours.push(h);
    }

    if (selectedDate.hasSame(luxon.DateTime.utc(), 'day') && h === luxon.DateTime.utc().hour) {
      hourBox.classList.add('current-hour');
    }

    timeline.appendChild(hourBox);
  }

  row.appendChild(timeline);
  document.getElementById("rows-container").appendChild(row);
  workingRanges.push(utcWorkingHours);
}

updateTimelines();
