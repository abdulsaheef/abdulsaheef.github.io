document.addEventListener('DOMContentLoaded', function() {
    // Initialize Luxon
    const { DateTime } = luxon;
    
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const addCityBtn = document.getElementById('add-city');
    const timelineContainer = document.querySelector('.timeline-container');
    const timeScale = document.querySelector('.time-scale');
    const participantsContainer = document.querySelector('.participants');
    const selectedSlot = document.getElementById('slot-time');
    const shareBtn = document.getElementById('share-btn');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const timeFormatBtns = document.querySelectorAll('.time-format button');
    const shareModal = document.getElementById('share-modal');
    const closeModal = document.querySelector('.close');
    const shareLink = document.getElementById('share-link');
    const copyLink = document.getElementById('copy-link');
    const convertedTimes = document.getElementById('converted-times');
    
    // App State
    let participants = [];
    let timeFormat = '24';
    let selectedStart = null;
    let selectedEnd = null;
    let isDragging = false;
    
    // Timezone data (simplified - in a real app you'd use an API)
    const timezoneData = {
        'New York': 'America/New_York',
        'London': 'Europe/London',
        'Tokyo': 'Asia/Tokyo',
        'Sydney': 'Australia/Sydney',
        'Los Angeles': 'America/Los_Angeles',
        'Chicago': 'America/Chicago',
        'Denver': 'America/Denver',
        'Paris': 'Europe/Paris',
        'Berlin': 'Europe/Berlin',
        'Mumbai': 'Asia/Kolkata',
        'Singapore': 'Asia/Singapore',
        'Beijing': 'Asia/Shanghai',
        'Dubai': 'Asia/Dubai',
        'San Francisco': 'America/Los_Angeles'
    };
    
    // Initialize the app
    function init() {
        renderTimeScale();
        setupEventListeners();
        loadThemePreference();
        
        // Add some default cities for demo
        addParticipant('New York');
        addParticipant('London');
        addParticipant('Sydney');
    }
    
    // Set up event listeners
    function setupEventListeners() {
        addCityBtn.addEventListener('click', addCity);
        cityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addCity();
        });
        
        shareBtn.addEventListener('click', openShareModal);
        resetBtn.addEventListener('click', resetSelection);
        themeToggle.addEventListener('click', toggleTheme);
        
        timeFormatBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                timeFormatBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                timeFormat = this.dataset.format;
                renderParticipants();
                updateSelectedSlotDisplay();
            });
        });
        
        closeModal.addEventListener('click', closeShareModal);
        copyLink.addEventListener('click', copyShareLink);
        
        window.addEventListener('click', function(e) {
            if (e.target === shareModal) closeShareModal();
        });
    }
    
    // Add a city/participant
    function addCity() {
        const cityName = cityInput.value.trim();
        if (cityName && !participants.some(p => p.name.toLowerCase() === cityName.toLowerCase())) {
            addParticipant(cityName);
            cityInput.value = '';
        }
    }
    
    // Add a participant with the given city name
    function addParticipant(cityName) {
        const timezone = timezoneData[cityName] || guessTimezone(cityName);
        if (!timezone) {
            alert(`Could not determine timezone for ${cityName}. Please try a major city.`);
            return;
        }
        
        const participant = {
            name: cityName,
            timezone: timezone,
            workingHours: { start: 9, end: 17 } // Default 9am-5pm
        };
        
        participants.push(participant);
        renderParticipants();
    }
    
    // Guess timezone based on city name (simplified)
    function guessTimezone(cityName) {
        const lowerName = cityName.toLowerCase();
        
        if (lowerName.includes('new york') || lowerName.includes('nyc')) return 'America/New_York';
        if (lowerName.includes('london')) return 'Europe/London';
        if (lowerName.includes('tokyo')) return 'Asia/Tokyo';
        if (lowerName.includes('sydney')) return 'Australia/Sydney';
        if (lowerName.includes('los angeles') || lowerName.includes('la') || lowerName.includes('san francisco')) return 'America/Los_Angeles';
        if (lowerName.includes('chicago')) return 'America/Chicago';
        if (lowerName.includes('paris')) return 'Europe/Paris';
        if (lowerName.includes('berlin')) return 'Europe/Berlin';
        if (lowerName.includes('mumbai') || lowerName.includes('delhi')) return 'Asia/Kolkata';
        if (lowerName.includes('singapore')) return 'Asia/Singapore';
        if (lowerName.includes('beijing') || lowerName.includes('shanghai')) return 'Asia/Shanghai';
        if (lowerName.includes('dubai')) return 'Asia/Dubai';
        
        return null;
    }
    
    // Render the time scale (0-24 hours)
    function renderTimeScale() {
        timeScale.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const hourDiv = document.createElement('div');
            hourDiv.textContent = formatHour(hour);
            timeScale.appendChild(hourDiv);
        }
    }
    
    // Render all participants
    function renderParticipants() {
        participantsContainer.innerHTML = '';
        
        participants.forEach(participant => {
            const participantDiv = document.createElement('div');
            participantDiv.className = 'participant';
            
            // Participant name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'participant-name';
            nameDiv.textContent = `${participant.name} (${getTimezoneAbbreviation(participant.timezone)})`;
            participantDiv.appendChild(nameDiv);
            
            // Hours slots
            const hoursDiv = document.createElement('div');
            hoursDiv.className = 'participant-hours';
            
            for (let hour = 0; hour < 24; hour++) {
                const hourSlot = document.createElement('div');
                hourSlot.className = 'hour-slot';
                hourSlot.dataset.hour = hour;
                hourSlot.dataset.participant = participant.name;
                
                // Add working hours highlight
                if (hour >= participant.workingHours.start && hour < participant.workingHours.end) {
                    const workingHours = document.createElement('div');
                    workingHours.className = 'working-hours';
                    hourSlot.appendChild(workingHours);
                }
                
                // Add event listeners for selection
                hourSlot.addEventListener('mousedown', startSelection);
                hourSlot.addEventListener('mouseenter', duringSelection);
                hourSlot.addEventListener('mouseup', endSelection);
                
                hoursDiv.appendChild(hourSlot);
            }
            
            participantDiv.appendChild(hoursDiv);
            participantsContainer.appendChild(participantDiv);
        });
        
        highlightOverlaps();
    }
    
    // Format hour based on current time format
    function formatHour(hour) {
        if (timeFormat === '12') {
            return hour % 12 === 0 ? 12 : hour % 12;
        }
        return hour;
    }
    
    // Get timezone abbreviation
    function getTimezoneAbbreviation(timezone) {
        try {
            return DateTime.now().setZone(timezone).toFormat('ZZZZ');
        } catch (e) {
            return timezone.split('/').pop();
        }
    }
    
    // Time slot selection functions
    function startSelection(e) {
        isDragging = true;
        const hour = parseInt(e.target.dataset.hour);
        selectedStart = hour;
        selectedEnd = hour;
        updateSelection();
        e.preventDefault(); // Prevent text selection
    }
    
    function duringSelection(e) {
        if (!isDragging) return;
        const hour = parseInt(e.target.dataset.hour);
        selectedEnd = hour;
        updateSelection();
    }
    
    function endSelection() {
        isDragging = false;
        updateSelectedSlotDisplay();
    }
    
    // Update the visual selection
    function updateSelection() {
        clearSelectionHighlights();
        
        const start = Math.min(selectedStart, selectedEnd);
        const end = Math.max(selectedStart, selectedEnd);
        
        document.querySelectorAll('.hour-slot').forEach(slot => {
            const hour = parseInt(slot.dataset.hour);
            if (hour >= start && hour <= end) {
                const highlight = document.createElement('div');
                highlight.className = 'overlap-highlight';
                slot.appendChild(highlight);
            }
        });
    }
    
    // Clear all selection highlights
    function clearSelectionHighlights() {
        document.querySelectorAll('.overlap-highlight').forEach(el => el.remove());
    }
    
    // Update the selected slot text display
    function updateSelectedSlotDisplay() {
        if (selectedStart === null || selectedEnd === null) {
            selectedSlot.textContent = 'Select a time slot';
            return;
        }
        
        const start = Math.min(selectedStart, selectedEnd);
        const end = Math.max(selectedStart, selectedEnd) + 1; // Make end hour exclusive
        
        selectedSlot.textContent = `${formatHourForDisplay(start)}–${formatHourForDisplay(end)} UTC`;
    }
    
    // Format hour for display in the selected slot
    function formatHourForDisplay(hour) {
        if (timeFormat === '12') {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            return `${displayHour}${period}`;
        }
        return `${hour}:00`;
    }
    
    // Highlight overlapping working hours
    function highlightOverlaps() {
        // In a real app, you'd calculate actual overlaps across timezones
        // This is a simplified version that just highlights 9am-5pm in all timezones
    }
    
    // Share functionality
    function openShareModal() {
        if (selectedStart === null || selectedEnd === null) {
            alert('Please select a time slot first');
            return;
        }
        
        const start = Math.min(selectedStart, selectedEnd);
        const end = Math.max(selectedStart, selectedEnd) + 1;
        
        // Generate share link
        const params = new URLSearchParams();
        params.set('start', start);
        params.set('end', end);
        participants.forEach(p => params.append('city', p.name));
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        shareLink.value = shareUrl;
        
        // Generate converted times
        convertedTimes.innerHTML = '';
        participants.forEach(participant => {
            const timeStr = getLocalTimeString(participant.timezone, start, end);
            
            const timeZoneItem = document.createElement('div');
            timeZoneItem.className = 'time-zone-item';
            timeZoneItem.innerHTML = `
                <span>${participant.name}:</span>
                <span>${timeStr}</span>
            `;
            
            convertedTimes.appendChild(timeZoneItem);
        });
        
        shareModal.style.display = 'block';
    }
    
    // Get local time string for a timezone
    function getLocalTimeString(timezone, startHour, endHour) {
        try {
            const startTime = DateTime.now().setZone(timezone).set({ hour: startHour, minute: 0 });
            const endTime = DateTime.now().setZone(timezone).set({ hour: endHour, minute: 0 });
            
            if (timeFormat === '12') {
                return `${startTime.toFormat('h:mm a')} – ${endTime.toFormat('h:mm a')}`;
            }
            return `${startTime.toFormat('HH:mm')} – ${endTime.toFormat('HH:mm')}`;
        } catch (e) {
            return 'Error calculating time';
        }
    }
    
    function closeShareModal() {
        shareModal.style.display = 'none';
    }
    
    function copyShareLink() {
        shareLink.select();
        document.execCommand('copy');
        
        // Change button text temporarily
        const originalText = copyLink.innerHTML;
        copyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyLink.innerHTML = originalText;
        }, 2000);
    }
    
    // Reset selection
    function resetSelection() {
        selectedStart = null;
        selectedEnd = null;
        clearSelectionHighlights();
        updateSelectedSlotDisplay();
    }
    
    // Theme toggle
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    // Load theme preference from localStorage
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    // Initialize the app
    init();
});