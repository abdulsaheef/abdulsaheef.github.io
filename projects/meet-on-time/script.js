
const DateTime = luxon.DateTime;

const cities = [
  { name: "New York", zone: "America/New_York" },
  { name: "London", zone: "Europe/London" },
  { name: "Dubai", zone: "Asia/Dubai" }
];

const rowsContainer = document.getElementById('rows-container');
const nowUTC = DateTime.utc();
const currentUTCHour = nowUTC.hour;

const workingRanges = [];

cities.forEach(city => {
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
    const utcTime = nowUTC.set({ hour: h, minute: 0 });
    const localTime = utcTime.setZone(city.zone);
    const hourNum = parseInt(localTime.toFormat("HH"));
    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = localTime.toFormat("HH");

    if (hourNum >= 9 && hourNum < 17) {
      hourBox.classList.add('working-hour');
      utcWorkingHours.push(h);
    }

    if (hourNum === localTime.hour && h === currentUTCHour) {
      hourBox.classList.add('current-hour');
    }

    timeline.appendChild(hourBox);
  }

  row.appendChild(timeline);
  rowsContainer.appendChild(row);

  workingRanges.push(utcWorkingHours);
});

// Find overlap in UTC working hours
function findOverlap(ranges) {
  return ranges.reduce((a, b) => a.filter(c => b.includes(c)));
}

const overlap = findOverlap(workingRanges);

// Highlight overlap in all timelines
document.querySelectorAll(".timeline-row").forEach((row, idx) => {
  const cells = row.querySelectorAll(".cell");
  overlap.forEach(hour => {
    if (cells[hour]) {
      cells[hour].classList.add("overlap-hour");
    }
  });
});

// Show best time suggestion
const suggestion = document.createElement('div');
suggestion.className = 'best-time';
if (overlap.length > 0) {
  const bestHour = overlap[Math.floor(overlap.length / 2)];
  const bestTimeUTC = nowUTC.set({ hour: bestHour, minute: 0 }).toFormat("HH:mm");

  let text = `✅ Best Time Found: ${bestTimeUTC} UTC\n`;
  cities.forEach(city => {
    const local = nowUTC.set({ hour: bestHour, minute: 0 }).setZone(city.zone).toFormat("hh:mm a");
    text += `- ${city.name}: ${local}\n`;
  });

  suggestion.textContent = text;
} else {
  suggestion.textContent = "⚠️ No common working hour found.";
}

document.querySelector("main").appendChild(suggestion);

document.getElementById('exit-btn').addEventListener('click', () => {
  alert('Exit clicked. You may manually close the tab.');
});

let isDragging = false;
let dragStart = null;
let selectedCells = [];

const headerRow = document.querySelector(".timeline-row.header .timeline-cells");
headerRow.querySelectorAll(".cell").forEach((cell, idx) => {
  cell.classList.add("selectable");

  cell.addEventListener("mousedown", () => {
    isDragging = true;
    dragStart = idx;
    clearSelection();
  });

  cell.addEventListener("mouseenter", () => {
    if (isDragging) {
      updateSelection(dragStart, idx);
    }
  });

  cell.addEventListener("mouseup", () => {
    isDragging = false;
    updateSelection(dragStart, idx);
    playSelectSound();
    showSelectionInfo();
  });
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

function clearSelection() {
  selectedCells.forEach(cell => cell.classList.remove("selected"));
  selectedCells = [];
}

function updateSelection(start, end) {
  clearSelection();
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  const allHeaderCells = headerRow.querySelectorAll(".cell");

  for (let i = min; i <= max; i++) {
    allHeaderCells[i].classList.add("selected");
    selectedCells.push(allHeaderCells[i]);
  }
}

function showSelectionInfo() {
  const container = document.getElementById("selection-info") || document.createElement("div");
  container.id = "selection-info";

  if (selectedCells.length === 0) {
    container.textContent = "No time selected.";
    return;
  }

  const hours = selectedCells.map(cell => parseInt(cell.getAttribute("data-hour")));
  const fromUTC = DateTime.utc().set({ hour: Math.min(...hours), minute: 0 });
  const toUTC = DateTime.utc().set({ hour: Math.max(...hours) + 1, minute: 0 });

  let infoText = `🟠 You selected: ${fromUTC.toFormat("HH:mm")} to ${toUTC.toFormat("HH:mm")} UTC\n`;

  cities.forEach(city => {
    const fromLocal = fromUTC.setZone(city.zone).toFormat("hh:mm a");
    const toLocal = toUTC.setZone(city.zone).toFormat("hh:mm a");
    infoText += `- ${city.name}: ${fromLocal} – ${toLocal}\n`;
  });

  container.textContent = infoText;
  document.querySelector("main").appendChild(container);
}

// Sound feedback
function playSelectSound() {
  const beep = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  beep.volume = 0.4;
  beep.play();
}
