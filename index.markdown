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
let group, textMesh1, pointLight;
let materials = [];
let particles, particleSystem;
let particleMixRatios = []; // Store consistent mix ratios for particle colors
let starfield; // Static background stars for cosmic effect
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerX = 0;
let pointerXOnPointerDown = 0;
let isUserInteracting = false;
let autoRotateTimeout = null;
const autoRotateSpeed = 0.01;
const autoRotateDelay = 2000; // 2 seconds

// Responsive mobile detection using matchMedia
let isMobile = window.matchMedia('(max-width: 767px)').matches;

// Update isMobile on viewport resize/orientation change
window.matchMedia('(max-width: 767px)').addEventListener('change', (e) => {
  isMobile = e.matches;
});

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
// Optimized geometry settings for 60 FPS performance with good quality
const bevelEnabled = false; // Disabled (bevels are expensive)
const depth = 6; // Moderate depth for visual appeal
const size = 52; // 25% larger to better fill space
const hover = 30;
const curveSegments = 1; // Minimal curves maintain smooth appearance
const bevelThickness = 0; // Not used
const bevelSize = 0; // Not used

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

  // Update particle colors using stored mix ratios for consistency
  if (particleSystem && particles) {
    const colorArray = particles.attributes.color.array;
    const count = colorArray.length / 3;
    const hex1 = themeColors[theme].side;
    const hex2 = themeColors[theme].pointLight;
    const color1 = new THREE.Color(hex1);
    const color2 = new THREE.Color(hex2);
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Reuse stored mix ratio for consistent particle colors across theme changes
      const mixRatio = particleMixRatios[i] || Math.random();
      tempColor.copy(color1).lerp(color2, mixRatio);
      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }

    particles.attributes.color.needsUpdate = true;
  }

  // Update starfield colors
  updateStarfieldColors();
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

// Disconnect the observer when the page is unloaded to prevent memory leaks
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});

// Create particle system with enhanced cosmic feel
function createParticles() {
  const particleCount = isMobile ? 18 : 30;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Generate and store mix ratios to ensure consistency across theme changes
  particleMixRatios = [];
  for (let i = 0; i < particleCount; i++) {
    particleMixRatios.push(Math.random());
  }

  const theme = getCurrentTheme();
  const hex1 = themeColors[theme].side;
  const hex2 = themeColors[theme].pointLight;
  const color1 = new THREE.Color(hex1);
  const color2 = new THREE.Color(hex2);
  const tempColor = new THREE.Color();

  for (let i = 0; i < particleCount; i++) {
    // Position particles in a sphere around the scene
    const radius = Math.random() * 600 + 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 100;
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Color variation using stored mix ratio for consistency
    tempColor.copy(color1).lerp(color2, particleMixRatios[i]);
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  particles = new THREE.BufferGeometry();
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending, // Cosmic glow effect
    sizeAttenuation: true
  });

  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

// Create a cosmic starfield background
function createStarfield() {
  const starCount = isMobile ? 100 : 200;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const theme = getCurrentTheme();
  const baseColor = new THREE.Color(theme === 'dark' ? 0xa78bfa : 0x7dd3fc);
  const accentColor = new THREE.Color(theme === 'dark' ? 0x22d3ee : 0x60a5fa);
  const tempColor = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    // Distribute stars in a large sphere
    const radius = Math.random() * 1200 + 600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);

    // Subtle color variation
    const mixRatio = Math.random();
    tempColor.copy(baseColor).lerp(accentColor, mixRatio);
    starColors[i * 3] = tempColor.r;
    starColors[i * 3 + 1] = tempColor.g;
    starColors[i * 3 + 2] = tempColor.b;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  starfield = new THREE.Points(starGeometry, starMaterial);
  scene.add(starfield);
}

// Update starfield colors on theme change
function updateStarfieldColors() {
  if (!starfield) return;

  const theme = getCurrentTheme();
  const baseColor = new THREE.Color(theme === 'dark' ? 0xa78bfa : 0x7dd3fc);
  const accentColor = new THREE.Color(theme === 'dark' ? 0x22d3ee : 0x60a5fa);
  const tempColor = new THREE.Color();

  const colorArray = starfield.geometry.attributes.color.array;
  const count = colorArray.length / 3;

  for (let i = 0; i < count; i++) {
    const mixRatio = Math.random();
    tempColor.copy(baseColor).lerp(accentColor, mixRatio);
    colorArray[i * 3] = tempColor.r;
    colorArray[i * 3 + 1] = tempColor.g;
    colorArray[i * 3 + 2] = tempColor.b;
  }

  starfield.geometry.attributes.color.needsUpdate = true;
}

function init() {
  try {
    console.log('[Three.js] Initializing scene...');
    container = document.getElementById('threejs-container');

    if (!container) {
      console.error('[Three.js] Container element not found!');
      return;
    }

    // CAMERA - use container dimensions instead of window
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, containerWidth / containerHeight, 1, 2000);
    camera.position.set(0, 150, 700);
    cameraTarget = new THREE.Vector3(0, 100, 0);
    camera.lookAt(cameraTarget); // Set once here instead of every frame
    console.log('[Three.js] Camera initialized');

    // SCENE
    scene = new THREE.Scene();
    scene.background = null; // transparent background
    // Fog removed for better performance
    console.log('[Three.js] Scene created');
  
  // LIGHTS - Single simple light for maximum performance
  const theme = getCurrentTheme();
  const colors = themeColors[theme];

  // Use ambient light for simplest rendering (no calculations per vertex/fragment)
  const ambientLight = new THREE.AmbientLight(colors.pointLight, 1.5);
  scene.add(ambientLight);

  // Keep point light reference for theme updates
  pointLight = ambientLight;

  // MATERIALS - using theme colors (Lambert for better performance than Phong)
  materials = [
    new THREE.MeshLambertMaterial({ color: colors.front, flatShading: true }), // front
    new THREE.MeshLambertMaterial({ color: colors.side }) // side
  ];
  
  group = new THREE.Group();
  group.position.y = 100;
  scene.add(group);
  
  // Load font and create text
    console.log('[Three.js] Loading font...');
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
      console.log('[Three.js] Font loaded successfully');
      try {
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
        const centerOffsetX = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
        const centerOffsetY = -0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);

        textMesh1 = new THREE.Mesh(textGeo, materials);
        textMesh1.position.x = centerOffsetX;
        textMesh1.position.y = centerOffsetY + hover; // Center vertically, then offset by hover amount
        textMesh1.position.z = 0;
        textMesh1.rotation.x = 0;
        textMesh1.rotation.y = Math.PI * 2;
        group.add(textMesh1);
        console.log('[Three.js] Text mesh 1 created and added to group');
      } catch (error) {
        console.error('[Three.js] Error creating text geometry:', error);
      }
    }, undefined, function(error) {
      console.error('[Three.js] Error loading font:', error);
    });
  
  // RENDERER - Optimized for stable 60 FPS
    renderer = new THREE.WebGLRenderer({
      antialias: false, // Disabled for performance
      alpha: true, // Enable transparency for gradient background
      powerPreference: isMobile ? 'low-power' : 'default'
    });
    // Set pixel ratio for good balance between quality and performance (capped at 1.5)
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);
    console.log('[Three.js] Renderer created for 60 FPS performance');

    // Create particle system (moderate count for quality)
    createParticles();
    console.log('[Three.js] Particle system created');

    // Create cosmic starfield background
    createStarfield();
    console.log('[Three.js] Starfield created');

    // EVENTS
    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', onPointerDown);
    // Note: onPointerMove is added dynamically during drag in onPointerDown

    window.addEventListener('resize', onWindowResize);
    console.log('[Three.js] Event listeners attached');
    console.log('[Three.js] Initialization complete!');

  } catch (error) {
    console.error('[Three.js] Initialization error:', error);
  }
}

function onWindowResize() {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  isUserInteracting = true;
  if (autoRotateTimeout) {
    clearTimeout(autoRotateTimeout);
    autoRotateTimeout = null;
  }

  const rect = container.getBoundingClientRect();
  pointerXOnPointerDown = event.clientX - (rect.left + rect.width / 2);
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  const rect = container.getBoundingClientRect();
  pointerX = event.clientX - (rect.left + rect.width / 2);
  // Increase sensitivity on mobile for easier rotation
  const sensitivity = isMobile ? 0.03 : 0.02;
  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * sensitivity;
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

  const time = performance.now() * 0.0005; // Time-based animation

  // Auto-rotate if not interacting
  if (!isUserInteracting) {
    targetRotation += autoRotateSpeed;
  }

  // Smooth rotation interpolation
  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

  // Cosmic particle effects
  if (particleSystem) {
    // Subtle floating movement
    particleSystem.rotation.y = time * 0.05;
    particleSystem.rotation.x = Math.sin(time * 0.3) * 0.05;

    // Gentle pulsing effect on particle size (optimized to use uniform material property)
    const pulseScale = 1 + Math.sin(time * 2) * 0.1;
    particleSystem.material.size = 3 * pulseScale;
  }

  // Very subtle starfield rotation for depth
  if (starfield) {
    starfield.rotation.y = time * 0.02;
    starfield.rotation.x = time * 0.01;
  }

  // Render scene
  renderer.clear();
  renderer.render(scene, camera);
}
</script>
