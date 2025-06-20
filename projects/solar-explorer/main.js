const container = document.getElementById('container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 5000);
camera.position.set(0, 80, 250);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lighting
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 0, 0);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// Background
const starsTexture = new THREE.TextureLoader().load('assets/textures/stars.jpg');
scene.background = starsTexture;

// Celestial Bodies
const bodies = [
  { name: 'Sun',     size: 50,  distance: 0,   period: 0,     texture: 'sun.jpg' },
  { name: 'Earth',   size: 6,   distance: 120, period: 365,   texture: 'earth.jpg' },
  { name: 'Moon',    size: 1.6, distance: 130, period: 27,    texture: 'moon.jpg' },
  { name: 'Mars',    size: 3.2, distance: 160, period: 687,   texture: 'mars.jpg' },
  { name: 'Mercury', size: 2,   distance: 60,  period: 88,    texture: 'mercury.jpg' },
  { name: 'Venus',   size: 3.5, distance: 90,  period: 225,   texture: 'venus.jpg' },
  { name: 'Jupiter', size: 10,  distance: 200, period: 4333,  texture: 'jupiter.jpg' },
  { name: 'Saturn',  size: 9,   distance: 240, period: 10759, texture: 'saturn.jpg' },
  { name: 'Uranus',  size: 7,   distance: 280, period: 30687, texture: 'uranus.jpg' },
  { name: 'Neptune', size: 7,   distance: 320, period: 60190, texture: 'neptune.jpg' }
];

const loader = new THREE.TextureLoader();
const objects = {};

bodies.forEach(b => {
  const texture = loader.load('assets/textures/' + b.texture);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const geometry = new THREE.SphereGeometry(b.size, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(b.distance, 0, 0);
  scene.add(mesh);
  objects[b.name] = { mesh, ...b };
});

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime() / 5;
  bodies.forEach(b => {
    if (b.period > 0) {
      const angle = t * (2 * Math.PI / b.period);
      const x = Math.cos(angle) * b.distance;
      const z = Math.sin(angle) * b.distance;
      objects[b.name].mesh.position.set(x, 0, z);
    }
    // Rotate on axis
    objects[b.name].mesh.rotation.y += 0.002;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Responsive handling
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});