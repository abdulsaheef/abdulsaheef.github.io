const dial = document.getElementById('dial');
const needle = document.getElementById('needle');
const numeric = document.getElementById('numeric');
const cardinal = document.getElementById('cardinal');
const calibrationMsg = document.getElementById('calibration-msg');

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

let lastAlpha = null;
let unstableCount = 0;

function updateCompass(alpha) {
  const rotation = 360 - alpha;
  dial.style.transform = `rotate(${rotation}deg)`;
  needle.style.transform = `rotate(0deg)`; // Needle stays upward

  const deg = Math.round(alpha);
  numeric.textContent = `${deg}°`;
  animateElement(numeric);

  cardinal.textContent = directions[Math.round(deg / 45)];
  animateElement(cardinal);

  // Detect abnormal jumps
  if (lastAlpha !== null) {
    const diff = Math.abs(deg - lastAlpha);
    if (diff > 30) {
      unstableCount++;
    } else {
      unstableCount = Math.max(0, unstableCount - 1);
    }

    if (unstableCount >= 3) {
      showCalibrationBanner();
      unstableCount = 0;
    }
  }

  lastAlpha = deg;
}

function animateElement(el) {
  el.style.transition = 'transform 0.3s ease';
  el.style.transform = 'scale(1.2)';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 300);
}

function handleOrientation(event) {
  if (event.alpha !== null) {
    updateCompass(event.alpha);
  }
}

function showCalibrationBanner() {
  calibrationMsg.classList.add('visible');
  setTimeout(() => {
    calibrationMsg.classList.remove('visible');
  }, 4000);
}

function enableCompass() {
  showCalibrationBanner(); // show once on startup for user clarity

  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    DeviceOrientationEvent.requestPermission()
      .then(permission => {
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          numeric.textContent = 'Permission Denied';
        }
      })
      .catch(() => {
        numeric.textContent = 'Permission Error';
      });
  } else {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

document.body.addEventListener('click', enableCompass, { once: true });