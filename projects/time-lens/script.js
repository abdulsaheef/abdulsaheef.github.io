const canvas = document.getElementById("timelineCanvas");
const ctx = canvas.getContext("2d");

let centerX, centerY, zoom=1, angleOffset=0, isDragging=false, lastAngle=0, eventPositions=[], time=0;
let events=[];

function resizeCanvas(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    centerX=canvas.width/2;
    centerY=canvas.height/2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

fetch("assets/events.json")
.then(res=>res.json())
.then(data=>{ events=data; draw(); });

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    eventPositions=[]; time+=0.01;

    events.forEach((event,i)=>{
        const angle=i*0.3+angleOffset;
        const radius=(i+1)*30*zoom+Math.sin(i+time)*5;
        const x=centerX+radius*Math.cos(angle);
        const y=centerY+radius*Math.sin(angle);
        eventPositions.push({x,y,event});

        ctx.beginPath();
        ctx.arc(x,y,6,0,Math.PI*2);
        ctx.fillStyle="#00ffe7";
        ctx.shadowBlur=10;
        ctx.shadowColor="#00ffe7";
        ctx.fill();

        ctx.shadowBlur=0;
        ctx.font="12px Segoe UI";
        ctx.fillStyle="#ccc";
        ctx.fillText(event.title,x+10,y);
    });
    requestAnimationFrame(draw);
}

canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    const delta=e.deltaY>0?0.9:1.1;
    zoom*=delta;
    zoom=Math.max(0.3,Math.min(zoom,3));
});

canvas.addEventListener('mousedown', e=>{
    isDragging=true;
    lastAngle=Math.atan2(e.clientY-centerY,e.clientX-centerX);
});
canvas.addEventListener('mousemove', e=>{
    if(!isDragging) return;
    const currentAngle=Math.atan2(e.clientY-centerY,e.clientX-centerX);
    angleOffset+=currentAngle-lastAngle;
    lastAngle=currentAngle;
});
canvas.addEventListener('mouseup', ()=>isDragging=false);
canvas.addEventListener('mouseleave', ()=>isDragging=false);

canvas.addEventListener('click', e=>{
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left;
    const my=e.clientY-rect.top;
    for(let point of eventPositions){
        const dx=mx-point.x;
        const dy=my-point.y;
        if(Math.sqrt(dx*dx+dy*dy)<12){
            showCard(point.event,mx,my);
            return;
        }
    }
});

canvas.addEventListener('dblclick', ()=>{
    const card=document.getElementById('event-card');
    card.classList.remove('visible');
    card.classList.add('hidden');
});

function showCard(event,x,y){
    const card=document.getElementById('event-card');
    document.getElementById('card-title').textContent=event.title;
    document.getElementById('card-year').textContent=\`\${event.year}\`;
    document.getElementById('card-description').textContent=event.description;
    document.getElementById('card-image').src=event.image;
    card.style.left=\`\${x+15}px\`;
    card.style.top=\`\${y-50}px\`;
    card.classList.remove('hidden');
    card.classList.add('visible');
}

let touchStartX = 0;
let touchEndX = 0;
let currentPage = 0;

const container = document.getElementById("app-container");
const totalPages = 3;

function scrollToPage(page) {
  currentPage = Math.max(0, Math.min(page, totalPages - 1));
  container.scrollTo({
    left: window.innerWidth * currentPage,
    behavior: "smooth"
  });
}

// Swipe detection
container.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});

container.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const threshold = 50; // Minimum swipe distance
  const delta = touchEndX - touchStartX;

  if (Math.abs(delta) > threshold) {
    if (delta < 0) {
      scrollToPage(currentPage + 1); // swipe left
    } else {
      scrollToPage(currentPage - 1); // swipe right
    }
  }
}