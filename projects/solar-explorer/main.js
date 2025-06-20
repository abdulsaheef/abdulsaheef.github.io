const container = document.getElementById('container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 5000);
camera.position.set(0, 150, 400);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffffff, 2, 0);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Background color black
scene.background = new THREE.Color(0x000000);

// Bodies with basic colors (replace with textures if you want)
const bodies = [
  { name: 'Sun',     size: 50,  distance: 0,   period: 0,     color: 0xffff00 },
  { name: 'Mercury', size: 2,   distance: 60,  period: 88,    color: 0xaaaaaa },
  { name: 'Venus',   size: 3.5, distance: 90,  period: 225,   color: 0xffa500 },
  { name: 'Earth',   size: 6,   distance: 120, period: 365,   color: 0x0000ff },
  { name: 'Moon',    size: 1.6, distance: 130, period: 27,    color: 0x888888 },
  { name: 'Mars',    size: 3.2, distance: 160, period: 687,   color: 0xff0000 },
  { name: 'Jupiter', size: 10,  distance: 200, period: 4333,  color: 0xffd700 },
  { name: 'Saturn',  size: 9,   distance: 240, period: 10759, color: 0xffe4b5 },
  { name: 'Uranus',  size: 7,   distance: 280, period: 30687, color: 0x00ffff },
  { name: 'Neptune', size: 7,   distance: 320, period: 60190, color: 0x00008b }
];

const objects = {};
const labels = {};

// Create spheres and labels
bodies.forEach(b => {
  const mat = new THREE.MeshStandardMaterial({ color: b.color });
  const geo = new THREE.SphereGeometry(b.size, 32, 32);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(b.distance, 0, 0);
  scene.add(mesh);
  objects[b.name] = mesh;

  // Create label DOM elements
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = b.name;
  container.appendChild(label);
  labels[b.name] = label;
});

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime() / 5;

  bodies.forEach(b => {
    if (b.period > 0) {
      const angle = (elapsed * 2 * Math.PI) / b.period;
      const x = Math.cos(angle) * b.distance;
      const z = Math.sin(angle) * b.distance;
      objects[b.name].position.set(x, 0, z);
    }
    objects[b.name].rotation.y += 0.002;

    // Update label position
    const vector = new THREE.Vector3();
    vector.copy(objects[b.name].position);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;

    labels[b.name].style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    labels[b.name].style.zIndex = (1 - vector.z) * 100000 | 0;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});