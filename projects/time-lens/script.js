const canvas = document.getElementById("timelineCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function drawSpiral(events) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxRadius = Math.min(cx, cy) - 50;
  const totalTurns = 5;
  const spacing = maxRadius / (events.length + 2);

  for (let i = 0; i < events.length; i++) {
    const angle = i * 0.3;
    const radius = spacing * i;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    // Event Dot
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffe7";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffe7";
    ctx.fill();

    // Optional: Label
    ctx.font = "12px Segoe UI";
    ctx.fillStyle = "#ccc";
    ctx.shadowBlur = 0;
    ctx.fillText(events[i].title, x + 10, y);
  }
}

// Test data (replace with JSON fetch later)
const testEvents = [
  { year: -3000, title: "Writing Invented" },
  { year: 0, title: "Start of CE" },
  { year: 1066, title: "Norman Conquest" },
  { year: 1776, title: "US Independence" },
  { year: 1969, title: "Moon Landing" },
  { year: 2024, title: "You Built This 😎" },
  { year: 2050, title: "AI Singularity?" }
];

drawSpiral(testEvents);
