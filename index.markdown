---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<section class="threejs-hero" aria-label="Animated 3D text background">
  <div id="threejs-container"></div>
</section>

<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.161.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.161.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let container;
let camera, cameraTarget, scene, renderer;
let group, textMesh1, textMesh2, pointLight;
let materials = [];
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerX = 0;
let pointerXOnPointerDown = 0;
let isUserInteracting = false;
let autoRotateTimeout = null;
const autoRotateSpeed = 0.01;
const autoRotateDelay = 2000; // 2 seconds

// Theme colors
const themeColors = {
  light: {
    front: 0x7dd3fc,
    side: 0x3b82f6,
    pointLight: 0xffffff
  },
  dark: {
    front: 0xa78bfa,
    side: 0x8b5cf6,
    pointLight: 0x22d3ee
  }
};

const text = "{{ site.title | replace: "'", "\\'" }}";
const bevelEnabled = true;
const depth = 20;
const size = 60;
const hover = 30;
const curveSegments = 4;
const bevelThickness = 2;
const bevelSize = 1.5;
const mirror = true;

// Get current theme
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

// Update colors based on theme
function updateThemeColors() {
  const theme = getCurrentTheme();
  const colors = themeColors[theme];

  if (materials.length > 0) {
    materials[0].color.setHex(colors.front);
    materials[1].color.setHex(colors.side);
  }

  if (pointLight) {
    pointLight.color.setHex(colors.pointLight);
  }
}

init();
animate();

// Listen for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      updateThemeColors();
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

function init() {
  container = document.getElementById('threejs-container');
  
  // CAMERA
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 150, 700);
  cameraTarget = new THREE.Vector3(0, 100, 0);
  
  // SCENE
  scene = new THREE.Scene();
  scene.background = null; // transparent background
  scene.fog = new THREE.Fog(0x000000, 250, 1400);
  
  // LIGHTS
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  const theme = getCurrentTheme();
  const colors = themeColors[theme];

  pointLight = new THREE.PointLight(colors.pointLight, 4.5, 0, 0);
  pointLight.position.set(0, 100, 90);
  scene.add(pointLight);

  // MATERIALS - using theme colors
  materials = [
    new THREE.MeshPhongMaterial({ color: colors.front, flatShading: true }), // front
    new THREE.MeshPhongMaterial({ color: colors.side }) // side
  ];
  
  group = new THREE.Group();
  group.position.y = 100;
  scene.add(group);
  
  // Load font and create text
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
    const textGeo = new TextGeometry(text, {
      font: font,
      size: size,
      depth: depth,
      curveSegments: curveSegments,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled
    });
    
    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    
    textMesh1 = new THREE.Mesh(textGeo, materials);
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    group.add(textMesh1);
    
    if (mirror) {
      textMesh2 = new THREE.Mesh(textGeo, materials);
      textMesh2.position.x = centerOffset;
      textMesh2.position.y = -hover;
      textMesh2.position.z = depth;
      textMesh2.rotation.x = Math.PI;
      textMesh2.rotation.y = Math.PI * 2;
      group.add(textMesh2);
    }
  }, undefined, function(error) {
    console.error('Error loading font:', error);
  });
  
  // Add a plane
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
  );
  plane.position.y = 100;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
  
  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  // EVENTS
  container.style.touchAction = 'none';
  container.addEventListener('pointerdown', onPointerDown);
  
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;
  
  isUserInteracting = true;
  if (autoRotateTimeout) {
    clearTimeout(autoRotateTimeout);
    autoRotateTimeout = null;
  }
  
  pointerXOnPointerDown = event.clientX - window.innerWidth / 2;
  targetRotationOnPointerDown = targetRotation;
  
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;
  
  pointerX = event.clientX - window.innerWidth / 2;
  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
}

function onPointerUp(event) {
  if (event.isPrimary === false) return;
  
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  
  // Resume auto-rotation after delay
  autoRotateTimeout = setTimeout(() => {
    isUserInteracting = false;
  }, autoRotateDelay);
}

function animate() {
  requestAnimationFrame(animate);
  
  // Auto-rotate if not interacting
  if (!isUserInteracting) {
    targetRotation += autoRotateSpeed;
  }
  
  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
  
  camera.lookAt(cameraTarget);
  
  renderer.clear();
  renderer.render(scene, camera);
}
</script>

<style>
.threejs-hero {
  position: relative;
  width: 100vw;
  height: 70vh;
  min-height: 400px;
  overflow: hidden;
  margin-bottom: 2rem;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

#threejs-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

@media (max-width: 768px) {
  .threejs-hero {
    height: 50vh;
    min-height: 300px;
  }
}
</style>
