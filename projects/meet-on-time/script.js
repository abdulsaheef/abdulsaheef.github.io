
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
