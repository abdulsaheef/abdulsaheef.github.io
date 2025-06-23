const { DateTime } = luxon;

// App State
const state = {
  cities: [],
  workingHours: { start: 9, end: 17 },
  selectedRange: null,
  theme: localStorage.getItem('theme') || 'light',
  isDragging: false,
  dragStartHour: null
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

// City to timezone mappings (150+ cities)
const cityMappings = {
  // North America
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'houston': 'America/Chicago',
  'phoenix': 'America/Phoenix',
  'philadelphia': 'America/New_York',
  'san antonio': 'America/Chicago',
  'san diego': 'America/Los_Angeles',
  'dallas': 'America/Chicago',
  'san jose': 'America/Los_Angeles',
  'austin': 'America/Chicago',
  'jacksonville': 'America/New_York',
  'san francisco': 'America/Los_Angeles',
  'columbus': 'America/New_York',
  'charlotte': 'America/New_York',
  'indianapolis': 'America/New_York',
  'seattle': 'America/Los_Angeles',
  'denver': 'America/Denver',
  'washington': 'America/New_York',
  'boston': 'America/New_York',
  'el paso': 'America/Denver',
  'detroit': 'America/New_York',
  'nashville': 'America/Chicago',
  'portland': 'America/Los_Angeles',
  'memphis': 'America/Chicago',
  'oklahoma city': 'America/Chicago',
  'las vegas': 'America/Los_Angeles',
  'louisville': 'America/New_York',
  'baltimore': 'America/New_York',
  'milwaukee': 'America/Chicago',
  'albuquerque': 'America/Denver',
  'tucson': 'America/Phoenix',
  'fresno': 'America/Los_Angeles',
  'sacramento': 'America/Los_Angeles',
  'kansas city': 'America/Chicago',
  'atlanta': 'America/New_York',
  'miami': 'America/New_York',
  'colorado springs': 'America/Denver',
  'raleigh': 'America/New_York',
  'omaha': 'America/Chicago',
  'long beach': 'America/Los_Angeles',
  'virginia beach': 'America/New_York',
  'oakland': 'America/Los_Angeles',
  'minneapolis': 'America/Chicago',
  'tulsa': 'America/Chicago',
  'arlington': 'America/Chicago',
  'new orleans': 'America/Chicago',
  'wichita': 'America/Chicago',
  'cleveland': 'America/New_York',
  'tampa': 'America/New_York',
  'bakersfield': 'America/Los_Angeles',
  'aurora': 'America/Denver',
  'honolulu': 'Pacific/Honolulu',
  'anaheim': 'America/Los_Angeles',
  'santa ana': 'America/Los_Angeles',
  'corpus christi': 'America/Chicago',
  'riverside': 'America/Los_Angeles',
  'lexington': 'America/New_York',
  'stockton': 'America/Los_Angeles',
  'st. louis': 'America/Chicago',
  'st louis': 'America/Chicago',
  'pittsburgh': 'America/New_York',
  'cincinnati': 'America/New_York',
  'anchorage': 'America/Anchorage',
  'orlando': 'America/New_York',
  
  // Canada
  'toronto': 'America/Toronto',
  'montreal': 'America/Toronto',
  'vancouver': 'America/Vancouver',
  'calgary': 'America/Edmonton',
  'ottawa': 'America/Toronto',
  'edmonton': 'America/Edmonton',
  'winnipeg': 'America/Winnipeg',
  'quebec': 'America/Toronto',
  'hamilton': 'America/Toronto',
  'halifax': 'America/Halifax',
  
  // Europe
  'london': 'Europe/London',
  'berlin': 'Europe/Berlin',
  'paris': 'Europe/Paris',
  'rome': 'Europe/Rome',
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'lisbon': 'Europe/Lisbon',
  'amsterdam': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'vienna': 'Europe/Vienna',
  'prague': 'Europe/Prague',
  'warsaw': 'Europe/Warsaw',
  'budapest': 'Europe/Budapest',
  'dublin': 'Europe/Dublin',
  'copenhagen': 'Europe/Copenhagen',
  'oslo': 'Europe/Oslo',
  'stockholm': 'Europe/Stockholm',
  'helsinki': 'Europe/Helsinki',
  'athens': 'Europe/Athens',
  'moscow': 'Europe/Moscow',
  'istanbul': 'Europe/Istanbul',
  'zurich': 'Europe/Zurich',
  'munich': 'Europe/Berlin',
  'milan': 'Europe/Rome',
  'naples': 'Europe/Rome',
  'turkey': 'Europe/Istanbul',
  
  // Asia
  'tokyo': 'Asia/Tokyo',
  'delhi': 'Asia/Kolkata',
  'shanghai': 'Asia/Shanghai',
  'beijing': 'Asia/Shanghai',
  'mumbai': 'Asia/Kolkata',
  'osaka': 'Asia/Tokyo',
  'dhaka': 'Asia/Dhaka',
  'karachi': 'Asia/Karachi',
  'bangalore': 'Asia/Kolkata',
  'manila': 'Asia/Manila',
  'seoul': 'Asia/Seoul',
  'jakarta': 'Asia/Jakarta',
  'hong kong': 'Asia/Hong_Kong',
  'bangkok': 'Asia/Bangkok',
  'singapore': 'Asia/Singapore',
  'chennai': 'Asia/Kolkata',
  'kolkata': 'Asia/Kolkata',
  'hyderabad': 'Asia/Kolkata',
  'shenzhen': 'Asia/Shanghai',
  'wuhan': 'Asia/Shanghai',
  'tianjin': 'Asia/Shanghai',
  'chongqing': 'Asia/Shanghai',
  'chengdu': 'Asia/Shanghai',
  'xian': 'Asia/Shanghai',
  'kyoto': 'Asia/Tokyo',
  'dubai': 'Asia/Dubai',
  'riyadh': 'Asia/Riyadh',
  'jeddah': 'Asia/Riyadh',
  'tel aviv': 'Asia/Jerusalem',
  'jerusalem': 'Asia/Jerusalem',
  
  // Australia/Oceania
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'brisbane': 'Australia/Brisbane',
  'perth': 'Australia/Perth',
  'adelaide': 'Australia/Adelaide',
  'gold coast': 'Australia/Brisbane',
  'canberra': 'Australia/Sydney',
  'auckland': 'Pacific/Auckland',
  'wellington': 'Pacific/Auckland',
  
  // Africa
  'cairo': 'Africa/Cairo',
  'lagos': 'Africa/Lagos',
  'kinshasa': 'Africa/Kinshasa',
  'johannesburg': 'Africa/Johannesburg',
  'nairobi': 'Africa/Nairobi',
  'casablanca': 'Africa/Casablanca',
  'abidjan': 'Africa/Abidjan',
  'alexandria': 'Africa/Cairo',
  
  // South America
  'sao paulo': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'rio de janeiro': 'America/Sao_Paulo',
  'lima': 'America/Lima',
  'bogota': 'America/Bogota',
  'santiago': 'America/Santiago',
  'caracas': 'America/Caracas',
  'belo horizonte': 'America/Sao_Paulo'
};

// Initialize the app
function init() {
  // Check for Luxon and timezone support
  if (typeof luxon === 'undefined') {
    showCriticalError('Required library not loaded. Please refresh the page.');
    return;
  }

  if (!luxon.Settings.defaultZone.availableZones) {
    showNotification('Limited timezone support available', 'warning');
  }

  setTheme(state.theme);
  setupEventListeners();
  loadFromURL();
  updateLocalTimezone();
  renderTimeline();
}

// Event Listeners
function setupEventListeners() {
  // Theme toggle
  elements.modeToggle.addEventListener('click', toggleTheme);
  
  // Help modal
  elements.helpBtn.addEventListener('click', () => toggleModal(true));
  elements.closeModal.addEventListener('click', () => toggleModal(false));
  elements.helpModal.addEventListener('click', (e) => {
    if (e.target === elements.helpModal) toggleModal(false);
  });
  
  // City search
  elements.cityInput.addEventListener('input', debounce(handleCityInput, 300));
  elements.cityInput.addEventListener('focus', handleInputFocus);
  elements.cityInput.addEventListener('blur', handleInputBlur);
  elements.addCityBtn.addEventListener('click', addCity);
  elements.cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCity();
  });
  
  // Working hours
  elements.startTime.addEventListener('change', () => updateWorkingHours());
  elements.endTime.addEventListener('change', () => updateWorkingHours());
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', handlePresetClick);
  });
  
  // Timeline interaction
  elements.rowsContainer.addEventListener('mousedown', startSelection);
  document.addEventListener('mousemove', updateSelection);
  document.addEventListener('mouseup', endSelection);
  
  // Share buttons
  elements.copyLinkBtn.addEventListener('click', copyShareLink);
  elements.shareBtn.addEventListener('click', shareApp);
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showCriticalError(message) {
  document.body.innerHTML = `
    <div class="error-container">
      <h2>Application Error</h2>
      <p>${message}</p>
      <button onclick="window.location.reload()">Refresh Page</button>
    </div>
  `;
}

// Theme Management
function setTheme(theme) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const icon = elements.modeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  updateURL();
}

// Modal Control
function toggleModal(show) {
  elements.helpModal.classList.toggle('active', show);
  document.body.style.overflow = show ? 'hidden' : '';
}

// Timezone Functions
function updateLocalTimezone() {
  try {
    const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zone = DateTime.local().setZone(zoneName);
    const offset = zone.offset / 60;
    const offsetStr = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
    elements.localZone.textContent = `${zoneName} (${offsetStr})`;
  } catch (e) {
    console.error('Timezone detection failed:', e);
    elements.localZone.textContent = 'Timezone: Unknown';
  }
}

// City Management
function handleInputFocus() {
  if (elements.cityInput.value) handleCityInput();
}

function handleInputBlur() {
  setTimeout(() => {
    elements.suggestionsContainer.style.display = 'none';
  }, 200);
}

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
    const normalizedQuery = query.toLowerCase().trim();
    const matches = [];
    
    // Check predefined mappings first
    if (cityMappings[normalizedQuery]) {
      return [{
        name: query.trim(),
        zone: cityMappings[normalizedQuery],
        region: cityMappings[normalizedQuery].split('/')[0].replace('_', ' ')
      }];
    }

    // Search in timezone database if available
    if (luxon.Settings.defaultZone.availableZones) {
      const zones = luxon.Settings.defaultZone.availableZones;
      
      for (const zone of zones) {
        const lastSlash = zone.lastIndexOf('/');
        if (lastSlash === -1) continue;
        
        const cityName = zone.substring(lastSlash + 1).replace(/_/g, ' ');
        const region = zone.substring(0, lastSlash).replace(/\//g, ' › ');
        
        if (cityName.toLowerCase().includes(normalizedQuery)) {
          matches.push({ name: cityName, region, zone });
        }
      }
    }
    
    return matches.slice(0, 10);
  } catch (error) {
    console.error('City search failed:', error);
    showNotification('Error searching cities', 'error');
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
  if (!cityName) {
    showNotification('Please enter a city name', 'warning');
    return;
  }
  
  const zone = findTimezoneForCity(cityName);
  if (!zone) {
    showNotification(`Timezone not found for "${cityName}"`, 'error');
    return;
  }
  
  if (state.cities.some(c => c.zone === zone)) {
    showNotification('Timezone already added', 'warning');
    return;
  }
  
  const displayName = cityMappings[cityName.toLowerCase()] 
    ? cityName 
    : zone.split('/').pop().replace(/_/g, ' ');
  
  state.cities.push({ name: displayName, zone });
  elements.cityInput.value = '';
  elements.suggestionsContainer.style.display = 'none';
  
  renderTimeline();
  updateURL();
  showNotification(`${displayName} added`, 'success');
}

function findTimezoneForCity(cityName) {
  if (luxon.Settings.defaultZone.availableZones?.includes(cityName)) {
    return cityName;
  }
  
  const normalizedCity = cityName.toLowerCase().trim();
  if (cityMappings[normalizedCity]) {
    return cityMappings[normalizedCity];
  }
  
  if (luxon.Settings.defaultZone.availableZones) {
    const cityPart = cityName.replace(/ /g, '_').toLowerCase();
    return luxon.Settings.defaultZone.availableZones.find(zone => 
      zone.toLowerCase().endsWith(cityPart)
    );
  }
  
  return null;
}

function removeCity(cityName) {
  state.cities = state.cities.filter(c => c.name !== cityName);
  renderTimeline();
  updateURL();
  showNotification('City removed', 'success');
}

// Working Hours Management
function handlePresetClick(e) {
  const start = parseInt(e.target.dataset.start);
  const end = parseInt(e.target.dataset.end);
  elements.startTime.value = start;
  elements.endTime.value = end;
  updateWorkingHours(start, end);
}

function updateWorkingHours(start, end) {
  if (arguments.length === 0) {
    start = parseInt(elements.startTime.value);
    end = parseInt(elements.endTime.value);
  }
  
  // Validate and normalize inputs
  start = Math.max(0, Math.min(23, isNaN(start) ? 9 : start);
  end = Math.max(0, Math.min(23, isNaN(end) ? 17 : end);
  
  if (start > end) [start, end] = [end, start];
  
  state.workingHours = { start, end };
  elements.startTime.value = start;
  elements.endTime.value = end;
  
  renderTimeline();
  updateURL();
}

// Timeline Rendering
function renderTimeline() {
  elements.rowsContainer.innerHTML = '';
  
  if (state.cities.length === 0) {
    showEmptyState();
    return;
  }
  
  state.cities.forEach(city => createCityRow(city));
  updateCurrentTimeIndicator();
  highlightOverlappingHours();
  
  if (state.selectedRange) {
    updateSelectionDisplay(state.selectedRange);
  }
}

function showEmptyState() {
  elements.rowsContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-globe-americas"></i>
      <p>Add cities to compare timezones</p>
    </div>
  `;
  elements.overlapResults.innerHTML = '<p>Add cities to see overlaps</p>';
  elements.selectionInfo.innerHTML = '';
}

function createCityRow(city) {
  const row = document.createElement('div');
  row.className = 'timeline-row';
  
  // City cell
  const cityCell = document.createElement('div');
  cityCell.className = 'city-cell';
  cityCell.innerHTML = `
    <span>${city.name}</span>
    <button class="remove-city" data-city="${city.name}">
      <i class="fas fa-times"></i>
    </button>
  `;
  row.appendChild(cityCell);
  
  // Hours cells
  const hoursRow = document.createElement('div');
  hoursRow.className = 'hours-row';
  
  for (let h = 0; h < 24; h++) {
    const hourCell = createHourCell(city, h);
    hoursRow.appendChild(hourCell);
  }
  
  row.appendChild(hoursRow);
  elements.rowsContainer.appendChild(row);
  
  // Add remove handler
  cityCell.querySelector('.remove-city').addEventListener('click', (e) => {
    e.stopPropagation();
    removeCity(city.name);
  });
}

function createHourCell(city, utcHour) {
  const hourCell = document.createElement('div');
  hourCell.className = 'hour-cell';
  hourCell.dataset.hour = utcHour;
  
  const utcTime = DateTime.utc().set({ hour: utcHour });
  const localTime = utcTime.setZone(city.zone);
  const localHour = localTime.hour;
  
  // Working hours
  if (localHour >= state.workingHours.start && localHour < state.workingHours.end) {
    hourCell.classList.add('working-hour');
  }
  
  // Current hour
  if (utcHour === DateTime.utc().hour) {
    hourCell.classList.add('current-hour');
  }
  
  // Tooltip
  hourCell.title = `${city.name}: ${localTime.toFormat('HH:mm')} (${localTime.offsetNameShort})`;
  
  return hourCell;
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
  // Clear previous highlights
  document.querySelectorAll('.overlap-hour').forEach(el => {
    el.classList.remove('overlap-hour');
  });
  
  const overlaps = findOverlappingHours();
  
  // Apply new highlights
  overlaps.forEach(hour => {
    document.querySelectorAll(`.hour-cell[data-hour="${hour}"]`).forEach(cell => {
      cell.classList.add('overlap-hour');
    });
  });
  
  displayBestMeetingTimes(overlaps);
}

function findOverlappingHours() {
  if (state.cities.length < 2) return [];
  
  return state.cities
    .map(city => {
      const workingHours = [];
      for (let h = 0; h < 24; h++) {
        const localHour = DateTime.utc()
          .set({ hour: h })
          .setZone(city.zone)
          .hour;
        
        if (localHour >= state.workingHours.start && localHour < state.workingHours.end) {
          workingHours.push(h);
        }
      }
      return workingHours;
    })
    .reduce((a, b) => a.filter(c => b.includes(c)));
}

function displayBestMeetingTimes(overlaps) {
  elements.overlapResults.innerHTML = '';
  
  if (overlaps.length === 0) {
    elements.overlapResults.innerHTML = `
      <p>No overlapping working hours found</p>
    `;
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
  
  // Display each block
  timeBlocks.forEach(block => {
    const startHour = block[0];
    const endHour = block[block.length - 1] + 1;
    
    const div = document.createElement('div');
    div.className = 'overlap-time';
    div.innerHTML = `
      <span>${DateTime.utc().set({ hour: startHour }).toFormat('HH:mm')} - 
      ${DateTime.utc().set({ hour: endHour }).toFormat('HH:mm')} UTC</span>
      <span>${block.length} hour${block.length > 1 ? 's' : ''}</span>
    `;
    
    div.addEventListener('click', () => {
      state.selectedRange = { start: startHour, end: endHour };
      updateSelectionDisplay(state.selectedRange);
      updateURL();
    });
    
    elements.overlapResults.appendChild(div);
  });
}

// Selection Handling
function startSelection(e) {
  if (!e.target.classList.contains('hour-cell')) return;
  
  state.isDragging = true;
  state.dragStartHour = parseInt(e.target.dataset.hour);
  state.selectedRange = { 
    start: state.dragStartHour, 
    end: state.dragStartHour + 1 
  };
  updateSelectionDisplay(state.selectedRange);
}

function updateSelection(e) {
  if (!state.isDragging) return;
  
  const hourCell = document.elementFromPoint(e.clientX, e.clientY);
  if (!hourCell?.classList.contains('hour-cell')) return;
  
  const endHour = parseInt(hourCell.dataset.hour);
  const start = Math.min(state.dragStartHour, endHour);
  const end = Math.max(state.dragStartHour, endHour) + 1;
  
  state.selectedRange = { start, end };
  updateSelectionDisplay(state.selectedRange);
}

function endSelection() {
  state.isDragging = false;
  updateURL();
}

function updateSelectionDisplay(range) {
  if (!range) {
    elements.selectionOverlay.style.display = 'none';
    elements.selectionInfo.innerHTML = '';
    return;
  }
  
  // Update overlay
  const startPercent = (range.start / 24) * 100;
  const endPercent = (range.end / 24) * 100;
  elements.selectionOverlay.style.display = 'block';
  elements.selectionOverlay.style.left = `${startPercent}%`;
  elements.selectionOverlay.style.width = `${endPercent - startPercent}%`;
  
  // Update info display
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

// URL State Management
function updateURL() {
  const params = new URLSearchParams();
  
  // Cities
  state.cities.forEach(city => {
    params.append('city', `${city.name}|${city.zone}`);
  });
  
  // Working hours
  params.set('start', state.workingHours.start);
  params.set('end', state.workingHours.end);
  
  // Selection
  if (state.selectedRange) {
    params.set('selStart', state.selectedRange.start);
    params.set('selEnd', state.selectedRange.end);
  }
  
  // Theme
  params.set('theme', state.theme);
  
  window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // Theme
  const urlTheme = params.get('theme');
  if (urlTheme && ['light', 'dark'].includes(urlTheme)) {
    setTheme(urlTheme);
  }
  
  // Cities
  const cityParams = params.getAll('city');
  state.cities = cityParams.map(param => {
    const [name, zone] = param.split('|');
    return { name, zone };
  }).filter(city => {
    return !luxon.Settings.defaultZone.availableZones || 
           luxon.Settings.defaultZone.availableZones.includes(city.zone);
  });
  
  // Working hours
  const start = parseInt(params.get('start'));
  const end = parseInt(params.get('end'));
  if (!isNaN(start) && !isNaN(end)) {
    state.workingHours = { start, end };
    elements.startTime.value = start;
    elements.endTime.value = end;
  }
  
  // Selection
  const selStart = parseInt(params.get('selStart'));
  const selEnd = parseInt(params.get('selEnd'));
  if (!isNaN(selStart) && !isNaN(selEnd)) {
    state.selectedRange = { start: selStart, end: selEnd };
  }
}

// Sharing
function copyShareLink() {
  updateURL();
  navigator.clipboard.writeText(window.location.href)
    .then(() => showNotification('Link copied!', 'success'))
    .catch(() => showNotification('Failed to copy', 'error'));
}

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Meet on Time',
      text: 'Check out these meeting times',
      url: window.location.href
    }).catch(() => copyShareLink());
  } else {
    copyShareLink();
  }
}

// Notifications
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
setInterval(updateCurrentTimeIndicator, 60000);