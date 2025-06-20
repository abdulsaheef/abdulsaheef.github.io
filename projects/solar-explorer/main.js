window.onerror = (msg, url, line, col, error) => {
  const pre = document.createElement('pre');
  pre.style.position = 'fixed';
  pre.style.top = '0';
  pre.style.left = '0';
  pre.style.width = '100%';
  pre.style.maxHeight = '40vh';
  pre.style.overflowY = 'auto';
  pre.style.background = 'rgba(255,0,0,0.8)';
  pre.style.color = 'white';
  pre.style.padding = '10px';
  pre.style.zIndex = '9999';
  pre.textContent = 
    `Error: ${msg}\nAt: ${url}:${line}:${col}\n${error?.stack||''}`;
  document.body.appendChild(pre);
};

// THREE.js setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 10000);
camera.position.set(0, 200, 500);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Starfield background
const starsGeom = new THREE.BufferGeometry();
const starCount = 20000;
const posArr = new Float32Array(starCount * 3);
for(let i = 0; i < starCount; i++) {
  posArr[3*i] = (Math.random() - 0.5) * 6000;
  posArr[3*i+1] = (Math.random() - 0.5) * 6000;
  posArr[3*i+2] = (Math.random() - 0.5) * 6000;
}
starsGeom.setAttribute('position', new THREE.BufferAttribute(posArr,3));
scene.add(new THREE.Points(starsGeom, new THREE.PointsMaterial({ color:0xffffff, size:1 })));

// Lighting & Bloom effect
const sunLight = new THREE.PointLight(0xffffff, 2, 0);
scene.add(sunLight);
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.4, 0.85));

// Celestial bodies setup
const bodies = [
  {name:'Sun', size:50, texture:'assets/textures/sun.jpg', distance:0, period:0 },
  {name:'Earth', size:6, texture:'assets/textures/earth.jpg', distance:150, period:365 },
  {name:'Moon', size:1.6, texture:'assets/textures/moon.jpg', distance:160, period:27 },
  {name:'Mars', size:3.2, texture:'assets/textures/mars.jpg', distance:228, period:687 },
];
const objects = {};
bodies.forEach(b => {
  const mat = new THREE.MeshStandardMaterial({ map:new THREE.TextureLoader().load(b.texture) });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(b.size,32,32), mat);
  mesh.position.set(b.distance || 0, 0, 0);
  scene.add(mesh);
  objects[b.name] = {mesh, ...b};
});

// Animation & orbit calculations
const clock = new THREE.Clock();
function animate(){
  const t = clock.getElapsedTime() / 5;
  bodies.forEach(b => {
    if(b.period){
      const angle = t * (2*Math.PI / b.period);
      objects[b.name].mesh.position.set(Math.cos(angle)*b.distance, 0, Math.sin(angle)*b.distance);
    }
  });
  composer.render();
  requestAnimationFrame(animate);
}
animate();

// Responsive handling
window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  composer.setSize(container.clientWidth, container.clientHeight);
});
new THREE.TextureLoader().load(
  b.texture,
  tex => mat.map = tex,
  undefined,
  err => {
    console.error(`Failed to load texture: ${b.texture}`, err);
  }
);