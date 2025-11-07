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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let container;
let camera, cameraTarget, scene, renderer;
let group, textMesh1, textMesh2, pointLight;
let materials = [];
let particles, particleSystem;
let composer, bloomPass;
let mouseX = 0, mouseY = 0;
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerX = 0;
let pointerXOnPointerDown = 0;
let isUserInteracting = false;
let autoRotateTimeout = null;
const autoRotateSpeed = 0.01;
const autoRotateDelay = 2000; // 2 seconds

// Detect mobile devices
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || window.innerWidth < 768;

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

  // Update bloom settings based on theme
  if (bloomPass) {
    bloomPass.strength = theme === 'dark' ? 1.2 : 0.8;
    bloomPass.radius = theme === 'dark' ? 0.6 : 0.4;
    bloomPass.threshold = theme === 'dark' ? 0.3 : 0.5;
  }

  // Update particle colors
  if (particleSystem && particles) {
    const color1 = new THREE.Color(theme === 'dark' ? 0x8b5cf6 : 0x7dd3fc);
    const color2 = new THREE.Color(theme === 'dark' ? 0x22d3ee : 0x3b82f6);
    const colors = particles.attributes.color.array;
    const count = colors.length / 3;

    for (let i = 0; i < count; i++) {
      const mixRatio = Math.random();
      const color = color1.clone().lerp(color2, mixRatio);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particles.attributes.color.needsUpdate = true;
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

// Create particle system
function createParticles() {
  // Reduce particle count on mobile for better performance
  const particleCount = isMobile ? 300 : 1000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const theme = getCurrentTheme();
  const color1 = new THREE.Color(theme === 'dark' ? 0x8b5cf6 : 0x7dd3fc);
  const color2 = new THREE.Color(theme === 'dark' ? 0x22d3ee : 0x3b82f6);

  for (let i = 0; i < particleCount; i++) {
    // Position particles in a large sphere around the scene
    const radius = Math.random() * 600 + 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 100;
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Color variation
    const mixRatio = Math.random();
    const color = color1.clone().lerp(color2, mixRatio);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Size variation
    sizes[i] = Math.random() * 3 + 1;
  }

  particles = new THREE.BufferGeometry();
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

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
  renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, // Disable antialiasing on mobile for performance
    alpha: true,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  // Limit pixel ratio on mobile to improve performance
  renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // POST-PROCESSING
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass for glow effect - reduced quality on mobile
  const theme = getCurrentTheme();
  const bloomStrength = theme === 'dark' ? (isMobile ? 0.8 : 1.2) : (isMobile ? 0.5 : 0.8);
  const bloomRadius = theme === 'dark' ? (isMobile ? 0.4 : 0.6) : (isMobile ? 0.3 : 0.4);
  const bloomThreshold = theme === 'dark' ? 0.3 : 0.5;

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomStrength,
    bloomRadius,
    bloomThreshold
  );
  composer.addPass(bloomPass);

  // Create particle system
  createParticles();

  // EVENTS
  container.style.touchAction = 'none';
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onMouseMove);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  // Track mouse position for dynamic lighting
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  // Prevent default touch behavior on mobile to avoid page scrolling
  if (isMobile && event.type === 'touchstart') {
    event.preventDefault();
  }

  isUserInteracting = true;
  if (autoRotateTimeout) {
    clearTimeout(autoRotateTimeout);
    autoRotateTimeout = null;
  }

  pointerXOnPointerDown = event.clientX - window.innerWidth / 2;
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  // Add touch-specific event listeners for better mobile support
  if (isMobile) {
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  // Prevent default on touch to avoid scrolling
  if (isMobile && event.type === 'touchmove') {
    event.preventDefault();
  }

  pointerX = event.clientX - window.innerWidth / 2;
  // Increase sensitivity on mobile for easier rotation
  const sensitivity = isMobile ? 0.03 : 0.02;
  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * sensitivity;
}

function onPointerUp(event) {
  if (event.isPrimary === false) return;

  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);

  // Remove touch-specific event listeners
  if (isMobile) {
    document.removeEventListener('touchmove', onPointerMove);
    document.removeEventListener('touchend', onPointerUp);
  }

  // Resume auto-rotation after delay
  autoRotateTimeout = setTimeout(() => {
    isUserInteracting = false;
  }, autoRotateDelay);
}

function animate() {
  requestAnimationFrame(animate);

  // Animate particles
  if (particleSystem) {
    particleSystem.rotation.y += 0.0002;
    particleSystem.rotation.x += 0.0001;

    // Subtle pulsing effect on particle opacity (skip on mobile to save performance)
    if (!isMobile) {
      const time = Date.now() * 0.0005;
      particleSystem.material.opacity = 0.6 + Math.sin(time) * 0.2;
    }
  }

  // Dynamic lighting based on mouse position (reduced on mobile)
  if (pointLight && !isMobile) {
    const targetX = mouseX * 200;
    const targetY = mouseY * 100 + 100;

    // Smooth interpolation
    pointLight.position.x += (targetX - pointLight.position.x) * 0.05;
    pointLight.position.y += (targetY - pointLight.position.y) * 0.05;

    // Subtle color shift based on mouse position
    const hue = (mouseX + 1) * 0.5; // 0 to 1
    const time = Date.now() * 0.0001;
    pointLight.color.setHSL(hue * 0.3 + Math.sin(time) * 0.1, 0.8, 0.6);
  }

  // Auto-rotate if not interacting
  if (!isUserInteracting) {
    targetRotation += autoRotateSpeed;
  }

  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

  // Smooth camera movement (disabled on mobile for better performance)
  if (!isMobile) {
    const targetCameraX = mouseX * 30;
    const targetCameraY = 150 - mouseY * 20;
    camera.position.x += (targetCameraX - camera.position.x) * 0.02;
    camera.position.y += (targetCameraY - camera.position.y) * 0.02;
  }

  camera.lookAt(cameraTarget);

  // Render with post-processing
  composer.render();
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
