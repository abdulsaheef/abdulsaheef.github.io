
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
