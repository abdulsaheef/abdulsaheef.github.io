const dial = document.getElementById('dial');
const needle = document.getElementById('needle');
const numeric = document.getElementById('numeric');
const cardinal = document.getElementById('cardinal');

function updateCompass(alpha) {
  const rotation = 360 - alpha;
  dial.style.transform = `rotate(${rotation}deg)`;
  needle.style.transform = `rotate(0deg)`; // Needle stays fixed (upwards)

  const deg = Math.round(alpha);
  numeric.textContent = `${deg}°`;
  animateElement(numeric);

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  cardinal.textContent = directions[Math.round(deg / 45)];
  animateElement(cardinal);
}

function animateElement(el) {
  el.classList.remove('animate');        // Remove animation trigger
  void el.offsetWidth;                   // Force reflow
  el.classList.add('animate');           // Re-add to retrigger
}

function handleOrientation(event) {
  if (event.alpha !== null) {
    updateCompass(event.alpha);
  }
}

function enableCompass() {
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