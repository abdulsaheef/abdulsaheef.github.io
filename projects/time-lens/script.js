// script.js
const canvas = document.getElementById("timelineCanvas");
const ctx = canvas.getContext("2d");
const pages = document.querySelectorAll('.page');
let currentPage = 0;

// Initialize canvas and timeline variables
let centerX, centerY, zoom = 1, angleOffset = 0, isDragging = false, lastAngle = 0, eventPositions = [], time = 0;
let events = [];

// Set initial page
navigateTo(0);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Load events data
fetch("assets/events.json")
    .then(res => res.json())
    .then(data => { 
        events = data; 
        draw(); 
    });

// Main drawing function for the timeline
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    eventPositions = []; 
    time += 0.01;

    // Draw each event as a point on the spiral
    events.forEach((event, i) => {
        const angle = i * 0.3 + angleOffset;
        const radius = (i + 1) * 30 * zoom + Math.sin(i + time) * 5;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        eventPositions.push({ x, y, event });

        // Draw the glowing dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f0ff";
        ctx.fill();

        // Draw the event title
        ctx.shadowBlur = 0;
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(event.title, x + 15, y);
    });
    requestAnimationFrame(draw);
}

// Navigation function
function navigateTo(pageIndex) {
    // Validate page index
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    
    // Update current page
    currentPage = pageIndex;
    
    // Update active class on pages
    pages.forEach((page, index) => {
        if (index === pageIndex) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    // Update navigation dots
    const dots = document.querySelectorAll('.nav-dots .dot');
    dots.forEach((dot, index) => {
        if (index === pageIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Canvas interaction handlers
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= delta;
    zoom = Math.max(0.3, Math.min(zoom, 3));
});

canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
});

canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    angleOffset += currentAngle - lastAngle;
    lastAngle = currentAngle;
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    for (let point of eventPositions) {
        const dx = mx - point.x;
        const dy = my - point.y;
        if (Math.sqrt(dx * dx + dy * dy) < 12) {
            showCard(point.event, mx, my);
            return;
        }
    }
});

canvas.addEventListener('dblclick', () => {
    const card = document.getElementById('event-card');
    card.classList.remove('visible');
});

// Show event card
function showCard(event, x, y) {
    const card = document.getElementById('event-card');
    document.getElementById('card-title').textContent = event.title;
    document.getElementById('card-year').textContent = `${event.year}`;
    document.getElementById('card-description').textContent = event.description;
    document.getElementById('card-image').src = event.image;
    
    // Position the card intelligently based on click position
    const cardWidth = 300;
    const cardHeight = 300;
    let left = x + 20;
    let top = y - cardHeight / 2;
    
    // Adjust if card would go off screen
    if (left + cardWidth > window.innerWidth) {
        left = x - cardWidth - 20;
    }
    if (top + cardHeight > window.innerHeight) {
        top = window.innerHeight - cardHeight - 20;
    }
    if (top < 20) {
        top = 20;
    }
    
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.classList.add('visible');
}

// Handle keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        navigateTo(currentPage - 1);
    } else if (e.key === 'ArrowRight') {
        navigateTo(currentPage + 1);
    }
});