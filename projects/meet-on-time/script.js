const { DateTime } = luxon;

// App State
const state = {
  cities: [],
  workingHours: { start: 9, end: 17 },
  selectedRange: null,
  theme: localStorage.getItem('theme') || 'light'
};

// DOM Elements
const elements = {
  cityInput: document.getElementById('city-input'),
  addCityBtn: document.getElementById('add-city-btn'),
  rowsContainer: document.getElementById('rows-container'),
  localZone: document.getElementById('local-zone'),
  modeToggle: document.getElementById('mode-toggle'),
  helpBtn: document.getElementById('help-btn'),
  helpModal: document.getElementById('help-modal'),
  closeModal: document.querySelector('.close-modal'),
  startTime: document.getElementById('start-time'),
  endTime: document.getElementById('end-time'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  overlapResults: document.getElementById('overlap-results'),
  selectionInfo: document.getElementById('selection-info'),
  selectionOverlay: document.getElementById('selection-overlay'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  shareBtn: document.getElementById('share-btn'),
  suggestionsContainer: document.getElementById('suggestions-container')
};

// Initialize the app
function init() {
  setTheme(state.theme);
  setupEventListeners();
  loadFromURL();
  updateLocalTimezone();
  renderTimeline();
}

// Set up all event listeners
function setupEventListeners() {
  // Theme toggle
  elements.modeToggle.addEventListener('click', toggleTheme);
  
  // Help modal
  elements.helpBtn.addEventListener('click', () => toggleModal(true));
  elements.closeModal.addEventListener('click', () => toggleModal(false));
  
  // City search
  elements.cityInput.addEventListener('input', handleCityInput);
  elements.cityInput.addEventListener('focus', () => {
    if (elements.cityInput.value) handleCityInput();
  });
  elements.cityInput.addEventListener('blur', () => {
    setTimeout(() => {
      elements.suggestionsContainer.style.display = 'none';
    }, 200);
  });
  elements.addCityBtn.addEventListener('click', addCity);
  
  // Working hours
  elements.startTime.addEventListener('change', updateWorkingHours);
  elements.endTime.addEventListener('change', updateWorkingHours);
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const start = parseInt(btn.dataset.start);
      const end = parseInt(btn.dataset.end);
      elements.startTime.value = start;
      elements.endTime.value = end;
      updateWorkingHours(start, end);
    });
  });
  
  // Timeline interaction
  elements.rowsContainer.addEventListener('mousedown', startSelection);
  document.addEventListener('mousemove', updateSelection);
  document.addEventListener('mouseup', endSelection);
  
  // Share buttons
  elements.copyLinkBtn.addEventListener('click', copyShareLink);
  elements.shareBtn.addEventListener('click', shareApp);
}

// Theme functions
function setTheme(theme) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update icon
  const icon = elements.modeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Modal functions
function toggleModal(show) {
  elements.helpModal.classList.toggle('active', show);
}

// Timezone functions
function updateLocalTimezone() {
  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zone = luxon.DateTime.local().setZone(zoneName);
  const offset = zone.offset / 60;
  const offsetStr = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
  elements.localZone.textContent = `${zoneName} (${offsetStr})`;
}

// City functions
async function handleCityInput() {
  const query = elements.cityInput.value.trim();
  if (query.length < 2) {
    elements.suggestionsContainer.style.display = 'none';
    return;
  }
  
  const suggestions = await searchCities(query);
  showSuggestions(suggestions);
}

async function searchCities(query) {
  try {
    // Use the timezone database from Luxon Timezones
    const zones = luxon.Settings.defaultZone.availableZones;
    const matches = [];
    
    // Search in our known cities first
    for (const zone of zones) {
      const lastSlash = zone.lastIndexOf('/');
      if (lastSlash === -1) continue;
      
      const cityName = zone.substring(lastSlash + 1).replace(/_/g, ' ');
      const region = zone.substring(0, lastSlash).replace(/\//g, ' › ');
      
      if (cityName.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          name: cityName,
          region,
          zone
        });
      }
    }
    
    return matches.slice(0, 10);
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

function showSuggestions(suggestions) {
  elements.suggestionsContainer.innerHTML = '';
  
  if (suggestions.length === 0) {
    elements.suggestionsContainer.style.display = 'none';
    return;
  }
  
  suggestions.forEach(suggestion => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `
      <strong>${suggestion.name}</strong>
      <span>${suggestion.region}</span>
    `;
    div.addEventListener('click', () => {
      elements.cityInput.value = suggestion.name;
      elements.suggestionsContainer.style.display = 'none';
    });
    elements.suggestionsContainer.appendChild(div);
  });
  
  elements.suggestionsContainer.style.display = 'block';
}

function addCity() {
  const cityName = elements.cityInput.value.trim();
  if (!cityName) return;
  
  // Find the timezone for this city
  const zone = findTimezoneForCity(cityName);
  if (!zone) {
    showNotification('City not found or timezone unavailable', 'error');
    return;
  }
  
  // Check if city already added
  if (state.cities.some(c => c.name.toLowerCase() === cityName.toLowerCase())) {
    showNotification('City already added', 'warning');
    return;
  }
  
  // Add the city
  state.cities.push({
    name: cityName,
    zone
  });
  
  // Clear input
  elements.cityInput.value = '';
  elements.suggestionsContainer.style.display = 'none';
  
  // Update UI
  renderTimeline();
  updateURL();
  showNotification(`${cityName} added successfully`, 'success');
}

function findTimezoneForCity(cityName) {
  // Try to find an exact match first
  const zones = luxon.Settings.defaultZone.availableZones;
  const normalizedCity = cityName.toLowerCase().replace(/ /g, '_');
  
  for (const zone of zones) {
    const lastSlash = zone.lastIndexOf('/');
    if (lastSlash === -1) continue;
    
    const zoneCity = zone.substring(lastSlash + 1).toLowerCase();
    if (zoneCity === normalizedCity) {
      return zone;
    }
  }
  
  // If no exact match, try partial match
  for (const zone of zones) {
    if (zone.toLowerCase().includes(normalizedCity)) {
      return zone;
    }
  }
  
  return null;
}

function removeCity(cityName) {
  state.cities = state.cities.filter(c => c.name !== cityName);
  renderTimeline();
  updateURL();
}

// Working hours functions
function updateWorkingHours() {
  let start = parseInt(elements.startTime.value);
  let end = parseInt(elements.endTime.value);
  
  // Validate inputs
  if (isNaN(start)) start = 9;
  if (isNaN(end)) end = 17;
  
  start = Math.max(0, Math.min(23, start));
  end = Math.max(0, Math.min(23, end));
  
  // Ensure start is before end
  if (start > end) {
    [start, end] = [end, start];
    elements.startTime.value = start;
    elements.endTime.value = end;
  }
  
  state.workingHours = { start, end };
  renderTimeline();
  updateURL();
}

// Timeline rendering
function renderTimeline() {
  elements.rowsContainer.innerHTML = '';
  
  if (state.cities.length === 0) {
    elements.rowsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-globe-americas"></i>
        <p>Add cities to compare timezones</p>
      </div>
    `;
    elements.overlapResults.innerHTML = '';
    elements.selectionInfo.innerHTML = '';
    return;
  }
  
  // Create rows for each city
  state.cities.forEach((city, index) => {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    
    // City cell with remove button
    const cityCell = document.createElement('div');
    cityCell.className = 'city-cell';
    cityCell.innerHTML = `
      <span>${city.name}</span>
      <button class="remove-city" data-city="${city.name}">
        <i class="fas fa-times"></i>
      </button>
    `;
    row.appendChild(cityCell);
    
    // Hours row
    const hoursRow = document.createElement('div');
    hoursRow.className = 'hours-row';
    
    // Create hour cells
    for (let h = 0; h < 24; h++) {
      const hourCell = document.createElement('div');
      hourCell.className = 'hour-cell';
      hourCell.dataset.hour = h;
      
      // Convert UTC hour to local city time
      const utcTime = DateTime.utc().set({ hour: h });
      const localTime = utcTime.setZone(city.zone);
      const localHour = localTime.hour;
      
      // Check if it's a working hour
      if (localHour >= state.workingHours.start && localHour < state.workingHours.end) {
        hourCell.classList.add('working-hour');
      }
      
      // Check if it's current hour
      if (h === DateTime.utc().hour) {
        hourCell.classList.add('current-hour');
      }
      
      // Add tooltip
      hourCell.title = `${city.name}: ${localTime.toFormat('HH:mm')} (${localTime.offsetNameShort})`;
      
      hoursRow.appendChild(hourCell);
    }
    
    row.appendChild(hoursRow);
    elements.rowsContainer.appendChild(row);
    
    // Add remove city event listener
    cityCell.querySelector('.remove-city').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCity(city.name);
    });
  });
  
  // Update current time indicator position
  updateCurrentTimeIndicator();
  
  // Find and highlight overlapping hours
  highlightOverlappingHours();
  
  // Update selection if exists
  if (state.selectedRange) {
    updateSelectionDisplay(state.selectedRange);
  }
}

function updateCurrentTimeIndicator() {
  const now = DateTime.utc();
  const currentHour = now.hour;
  const currentMinute = now.minute;
  const hourWidth = 100 / 24;
  const minuteOffset = (currentMinute / 60) * hourWidth;
  const position = (currentHour * hourWidth) + minuteOffset;
  
  document.documentElement.style.setProperty('--current-time-position', `${position}%`);
}

function highlightOverlappingHours() {
  // Clear previous overlap highlights
  document.querySelectorAll('.overlap-hour').forEach(el => {
    el.classList.remove('overlap-hour');
  });
  
  // Get overlapping working hours
  const overlaps = findOverlappingHours();
  
  // Highlight overlapping hours
  overlaps.forEach(hour => {
    document.querySelectorAll(`.hour-cell[data-hour="${hour}"]`).forEach(cell => {
      cell.classList.add('overlap-hour');
    });
  });
  
  // Display best meeting times
  displayBestMeetingTimes(overlaps);
}

function findOverlappingHours() {
  if (state.cities.length === 0) return [];
  
  // Get working hours for each city in UTC
  const allWorkingHours = state.cities.map(city => {
    const workingHours = [];
    
    for (let h = 0; h < 24; h++) {
      const utcTime = DateTime.utc().set({ hour: h });
      const localTime = utcTime.setZone(city.zone);
      const localHour = localTime.hour;
      
      if (localHour >= state.workingHours.start && localHour < state.workingHours.end) {
        workingHours.push(h);
      }
    }
    
    return workingHours;
  });
  
  // Find intersection of all working hours
  return allWorkingHours.reduce((a, b) => a.filter(c => b.includes(c)));
}

function displayBestMeetingTimes(overlaps) {
  elements.overlapResults.innerHTML = '';
  
  if (overlaps.length === 0) {
    elements.overlapResults.innerHTML = '<p>No overlapping working hours found</p>';
    return;
  }
  
  // Group consecutive hours
  const timeBlocks = [];
  let currentBlock = [overlaps[0]];
  
  for (let i = 1; i < overlaps.length; i++) {
    if (overlaps[i] === currentBlock[currentBlock.length - 1] + 1) {
      currentBlock.push(overlaps[i]);
    } else {
      timeBlocks.push(currentBlock);
      currentBlock = [overlaps[i]];
    }
  }
  
  timeBlocks.push(currentBlock);
  
  // Display each time block
  timeBlocks.forEach(block => {
    const startHour = block[0];
    const endHour = block[block.length - 1] + 1;
    
    const div = document.createElement('div');
    div.className = 'overlap-time';
    
    const startTime = DateTime.utc().set({ hour: startHour }).toFormat('HH:mm');
    const endTime = DateTime.utc().set({ hour: endHour }).toFormat('HH:mm');
    
    div.innerHTML = `
      <span>${startTime} - ${endTime} UTC</span>
      <span>${block.length} hour${block.length > 1 ? 's' : ''}</span>
    `;
    
    div.addEventListener('click', () => {
      state.selectedRange = { start: startHour, end: endHour };
      updateSelectionDisplay(state.selectedRange);
    });
    
    elements.overlapResults.appendChild(div);
  });
}

// Selection handling
let isSelecting = false;
let startSelectHour = null;

function startSelection(e) {
  if (!e.target.classList.contains('hour-cell')) return;
  
  isSelecting = true;
  startSelectHour = parseInt(e.target.dataset.hour);
  state.selectedRange = { start: startSelectHour, end: startSelectHour + 1 };
  updateSelectionDisplay(state.selectedRange);
}

function updateSelection(e) {
  if (!isSelecting) return;
  
  const hourCell = document.elementFromPoint(e.clientX, e.clientY);
  if (!hourCell || !hourCell.classList.contains('hour-cell')) return;
  
  const endSelectHour = parseInt(hourCell.dataset.hour);
  
  // Determine start and end (could be dragging left or right)
  const start = Math.min(startSelectHour, endSelectHour);
  const end = Math.max(startSelectHour, endSelectHour) + 1;
  
  state.selectedRange = { start, end };
  updateSelectionDisplay(state.selectedRange);
}

function endSelection() {
  isSelecting = false;
  updateURL();
}

function updateSelectionDisplay(range) {
  if (!range) {
    elements.selectionOverlay.style.display = 'none';
    elements.selectionInfo.innerHTML = '';
    return;
  }
  
  // Update overlay position
  const startPercent = (range.start / 24) * 100;
  const endPercent = (range.end / 24) * 100;
  const width = endPercent - startPercent;
  
  elements.selectionOverlay.style.display = 'block';
  elements.selectionOverlay.style.left = `${startPercent}%`;
  elements.selectionOverlay.style.width = `${width}%`;
  
  // Update selection info
  const startTime = DateTime.utc().set({ hour: range.start }).toFormat('HH:mm');
  const endTime = DateTime.utc().set({ hour: range.end }).toFormat('HH:mm');
  
  let timeDetails = '';
  state.cities.forEach(city => {
    const localStart = DateTime.utc().set({ hour: range.start }).setZone(city.zone);
    const localEnd = DateTime.utc().set({ hour: range.end }).setZone(city.zone);
    
    timeDetails += `
      <div><strong>${city.name}:</strong></div>
      <div>${localStart.toFormat('HH:mm')} - ${localEnd.toFormat('HH:mm')} (${localStart.offsetNameShort})</div>
    `;
  });
  
  elements.selectionInfo.innerHTML = `
    <div class="time-display">
      <i class="fas fa-clock"></i>
      ${startTime} - ${endTime} UTC
    </div>
    <div class="time-details">
      ${timeDetails}
    </div>
  `;
}

// URL state management
function updateURL() {
  const params = new URLSearchParams();
  
  // Add cities
  state.cities.forEach(city => {
    params.append('city', `${city.name}|${city.zone}`);
  });
  
  // Add working hours
  params.set('start', state.workingHours.start);
  params.set('end', state.workingHours.end);
  
  // Add selection if exists
  if (state.selectedRange) {
    params.set('selStart', state.selectedRange.start);
    params.set('selEnd', state.selectedRange.end);
  }
  
  // Add theme
  params.set('theme', state.theme);
  
  // Update URL without reload
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // Load theme
  const urlTheme = params.get('theme');
  if (urlTheme && ['light', 'dark'].includes(urlTheme)) {
    setTheme(urlTheme);
  }
  
  // Load cities
  const cityParams = params.getAll('city');
  state.cities = cityParams.map(param => {
    const [name, zone] = param.split('|');
    return { name, zone };
  }).filter(city => luxon.Settings.defaultZone.availableZones.includes(city.zone));
  
  // Load working hours
  const start = parseInt(params.get('start'));
  const end = parseInt(params.get('end'));
  if (!isNaN(start) && !isNaN(end)) {
    state.workingHours = { start, end };
    elements.startTime.value = start;
    elements.endTime.value = end;
  }
  
  // Load selection
  const selStart = parseInt(params.get('selStart'));
  const selEnd = parseInt(params.get('selEnd'));
  if (!isNaN(selStart) && !isNaN(selEnd)) {
    state.selectedRange = { start: selStart, end: selEnd };
  }
}

// Share functions
function copyShareLink() {
  updateURL();
  navigator.clipboard.writeText(window.location.href)
    .then(() => showNotification('Link copied to clipboard', 'success'))
    .catch(() => showNotification('Failed to copy link', 'error'));
}

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Meet on Time',
      text: 'Check out these timezone overlaps for our meeting',
      url: window.location.href
    }).catch(() => {
      copyShareLink();
    });
  } else {
    copyShareLink();
  }
}

// Helper functions
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

// Update current time indicator every minute
setInterval(updateCurrentTimeIndicator, 60000);