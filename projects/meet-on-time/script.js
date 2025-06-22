
const DateTime = luxon.DateTime;

const cities = [
  { name: "New York", zone: "America/New_York" },
  { name: "London", zone: "Europe/London" },
  { name: "Dubai", zone: "Asia/Dubai" }
];

const rowsContainer = document.getElementById('rows-container');
const nowUTC = DateTime.utc();
const currentUTCHour = nowUTC.hour;

cities.forEach(city => {
  const row = document.createElement('div');
  row.className = 'timeline-row';

  const cityName = document.createElement('div');
  cityName.className = 'city-name';
  cityName.textContent = city.name;
  row.appendChild(cityName);

  const timeline = document.createElement('div');
  timeline.className = 'timeline-cells';

  for (let h = 0; h < 24; h++) {
    const utcTime = nowUTC.set({ hour: h, minute: 0 });
    const localTime = utcTime.setZone(city.zone);
    const hourBox = document.createElement('div');
    hourBox.className = 'cell';
    hourBox.textContent = localTime.toFormat("HH");

    // Highlight working hours (09–17)
    const hourNum = parseInt(localTime.toFormat("HH"));
    if (hourNum >= 9 && hourNum < 17) {
      hourBox.classList.add('working-hour');
    }

    // Current local hour
    if (hourNum === localTime.hour && h === currentUTCHour) {
      hourBox.classList.add('current-hour');
    }

    timeline.appendChild(hourBox);
  }

  row.appendChild(timeline);
  rowsContainer.appendChild(row);
});

document.getElementById('exit-btn').addEventListener('click', () => {
  alert('Exit clicked. You may manually close the tab.');
});
