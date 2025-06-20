const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
camera.position.set(0, 100, 400);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Bloom
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
composer.addPass(new THREE.UnrealBloomPass(
  new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85
));

// Lighting
const sunLight = new THREE.PointLight(0xffffff, 2, 0);
scene.add(sunLight);
sunLight.position.set(0, 0, 0); // 👈 explicitly place it at the sun

const lightHelper = new THREE.PointLightHelper(sunLight);
scene.add(lightHelper);

const debugSphere = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
scene.add(debugSphere);

// Background
const starsTexture = new THREE.TextureLoader().load('assets/textures/stars.jpg');
scene.background = starsTexture;

// Planet data
const planets = [
  { name: 'Earth',   size: 6,   distance: 120, period: 365,   texture: 'earth.jpg' },
  { name: 'Jupiter', size: 10,  distance: 200, period: 4333,  texture: 'jupiter.jpg' },
  { name: 'Mars',    size: 3.2, distance: 160, period: 687,   texture: 'mars.jpg' },
  { name: 'Mercury', size: 2,   distance: 60,  period: 88,    texture: 'mercury.jpg' },
  { name: 'Moon',    size: 1.6, distance: 130, period: 27,    texture: 'moon.jpg' },
  { name: 'Neptune', size: 7,   distance: 320, period: 60190, texture: 'neptune.jpg' },
  { name: 'Saturn',  size: 9,   distance: 240, period: 10759, texture: 'saturn.jpg' },
  // "stars" is background, not a planet
  { name: 'Sun',     size: 50,  distance: 0,   period: 0,     texture: 'sun.jpg' },
  { name: 'Uranus',  size: 7,   distance: 280, period: 30687, texture: 'uranus.jpg' },
  { name: 'Venus',   size: 3.5, distance: 90,  period: 225,   texture: 'venus.jpg' }
];

// Load planets
const objects = {};
const loader = new THREE.TextureLoader();
planets.forEach(body => {
  const texture = loader.load(`assets/textures/${body.texture}`);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const geometry = new THREE.SphereGeometry(body.size, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(body.distance, 0, 0);
  scene.add(mesh);
  objects[body.name] = { mesh, ...body };
});

// Animation
const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime() / 5;
  planets.forEach(b => {
    if (b.period > 0) {
      const angle = elapsed * (2 * Math.PI / b.period);
      const x = Math.cos(angle) * b.distance;
      const z = Math.sin(angle) * b.distance;
      objects[b.name].mesh.position.set(x, 0, z);
    }
  });
  composer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Resize
window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  composer.setSize(container.clientWidth, container.clientHeight);
});