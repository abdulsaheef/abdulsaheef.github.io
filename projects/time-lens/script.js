const canvas = document.getElementById("timelineCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let zoom = 1;
let angleOffset = 0;
let isDragging = false;
let lastAngle = 0;

let events = [];

fetch("assets/events.json")
  .then(res => res.json())
  .then(data => {
    events = data;
    draw();
  });

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const baseRadius = Math.min(centerX, centerY) * 0.9;

  events.forEach((event, i) => {
    const angle = i * 0.3 + angleOffset;
    const radius = (i + 1) * 30 * zoom;

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Draw dot
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffe7";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffe7";
    ctx.fill();

    // Label
    ctx.shadowBlur = 0;
    ctx.font = "12px Segoe UI";
    ctx.fillStyle = "#ccc";
    ctx.fillText(event.title, x + 10, y);
  });

  requestAnimationFrame(draw); // Live update
}

// Zoom on scroll
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  zoom *= delta;
  zoom = Math.max(0.3, Math.min(zoom, 3));
});

// Drag to rotate
canvas.addEventListener("mousedown", e => {
  isDragging = true;
  lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
});

canvas.addEventListener("mousemove", e => {
  if (!isDragging) return;
  const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  angleOffset += currentAngle - lastAngle;
  lastAngle = currentAngle;
});

canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);