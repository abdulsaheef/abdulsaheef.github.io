const compass = document.getElementById('compass');
const headingText = document.getElementById('heading');

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

function enableCompass() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    // iOS 13+ permission flow
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          headingText.textContent = 'Permission denied';
        }
      })
      .catch(() => {
        headingText.textContent = 'Permission error';
      });
  } else {
    // Non-iOS devices
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

// Ask permission when user taps the screen
document.body.addEventListener('click', enableCompass, { once: true });