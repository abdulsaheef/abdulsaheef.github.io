
document.getElementById('exit-btn').addEventListener('click', () => {
  window.close(); // May not work in all browsers
  alert('Exit button clicked. This may not close tab due to browser restrictions.');
});

document.getElementById('add-city-btn').addEventListener('click', () => {
  const city = document.getElementById('city-input').value.trim();
  if (city) {
    const container = document.getElementById('timeline-container');
    const div = document.createElement('div');
    div.textContent = `Timeline for: ${city}`;
    container.appendChild(div);
  }
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('timeline-container').innerHTML = '';
  document.getElementById('selected-time-display').textContent = '';
});

document.getElementById('share-btn').addEventListener('click', () => {
  alert('Share functionality coming soon!');
});
