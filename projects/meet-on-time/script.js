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

// Common city to timezone mappings
const cityMappings = {
  'tokyo': 'Asia/Tokyo',
  'new york': 'America/New_York',
  'london': 'Europe/London',
  'dubai': 'Asia/Dubai',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'singapore': 'Asia/Singapore',
  'sydney': 'Australia/Sydney',
  'san francisco': 'America/Los_Angeles',
  'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'toronto': 'America/Toronto',
  'moscow': 'Europe/Moscow',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'seoul': 'Asia/Seoul',
  'istanbul': 'Europe/Istanbul',
  'rome': 'Europe/Rome',
  'madrid': 'Europe/Madrid',
  'amsterdam': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'vienna': 'Europe/Vienna',
  'zurich': 'Europe/Zurich',
  'stockholm': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'helsinki': 'Europe/Helsinki',
  'cairo': 'Africa/Cairo',
  'johannesburg': 'Africa/Johannesburg',
  'nairobi': 'Africa/Nairobi',
  'riyadh': 'Asia/Riyadh',
  'tehran': 'Asia/Tehran',
  'baghdad': 'Asia/Baghdad',
  'bangalore': 'Asia/Kolkata',
  'jakarta': 'Asia/Jakarta',
  'bangkok': 'Asia/Bangkok',
  'hanoi': 'Asia/Bangkok',
  'ho chi minh': 'Asia/Bangkok',
  'manila': 'Asia/Manila',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  'perth': 'Australia/Perth',
  'melbourne': 'Australia/Melbourne',
  'auckland': 'Pacific/Auckland',
  'wellington': 'Pacific/Auckland',
  'honolulu': 'Pacific/Honolulu',
  'anchorage': 'America/Anchorage',
  'vancouver': 'America/Vancouver',
  'montreal': 'America/Toronto',
  'mexico city': 'America/Mexico_City',
  'sao paulo': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'santiago': 'America/Santiago',
  'lima': 'America/Lima',
  'bogota': 'America/Bogota'
};

// Full code continues with functions (already provided above)...
// Now completing the missing part from `displayBestMeetingTimes`:

function displayBestMeetingTimes(overlaps) {
  elements.overlapResults.innerHTML = '';

  if (overlaps.length === 0) {
    elements.overlapResults.innerHTML = '<p>No overlapping working hours found. Adjust working hours or try different cities.</p>';
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
      <span>${block.length} hour${block.length > 1 ? 's' : ''} overlap</span>
    `;

    elements.overlapResults.appendChild(div);
  });
}
