const container = document.getElementById('container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
camera.position.set(0, 0, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.PointLight(0xffffff, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888));

const urlParams = new URLSearchParams(window.location.search);
const planetName = urlParams.get('planet') || 'earth';

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('assets/textures/' + planetName + '.jpg');

const geometry = new THREE.SphereGeometry(30, 64, 64);
const material = new THREE.MeshStandardMaterial({ map: texture });
const planet = new THREE.Mesh(geometry, material);
scene.add(planet);

function animate() {
  requestAnimationFrame(animate);
  planet.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
