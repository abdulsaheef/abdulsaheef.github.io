const compass = document.getElementById('compass');
const headingText = document.getElementById('heading');

window.addEventListener('deviceorientationabsolute', handleOrientation, true);
window.addEventListener('deviceorientation', handleOrientation, true);

function handleOrientation(event) {
  const heading = event.alpha;

  if (typeof heading === 'number') {
    const rotation = 360 - heading;
    compass.style.transform = `rotate(${rotation}deg)`;
    headingText.textContent = `${Math.round(heading)}°`;
  } else {
    headingText.textContent = 'Compass not supported';
  }
}

if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  DeviceOrientationEvent.requestPermission()
    .then(permissionState => {
      if (permissionState === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    });
}