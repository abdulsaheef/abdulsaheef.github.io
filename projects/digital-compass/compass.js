const dial = document.getElementById('dial');
const needle = document.getElementById('needle');
const numeric = document.getElementById('numeric');
const cardinal = document.getElementById('cardinal');

function updateCompass(alpha) {
  const rotation = 360 - alpha;
  dial.style.transform = `rotate(${rotation}deg)`;
  needle.style.transform = `rotate(0deg)`;

  const deg = Math.round(alpha);
  numeric.textContent = `${deg}°`;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  cardinal.textContent = directions[Math.round(deg / 45)];
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
          numeric.textContent = 'Denied';
        }
      })
      .catch(() => {
        numeric.textContent = 'Error';
      });
  } else {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

document.body.addEventListener('click', enableCompass, { once: true });
