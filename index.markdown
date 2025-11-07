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
// Optimized geometry settings for 60 FPS performance with good quality
const bevelEnabled = false; // Disabled (bevels are expensive)
const depth = 6; // Moderate depth for visual appeal
const size = 45; // Good visual size with performance
const hover = 30;
const curveSegments = 1; // Minimal curves maintains smooth appearance
const bevelThickness = 0; // Not used
const bevelSize = 0; // Not used
const mirror = false; // Single mesh for best performance

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
    const hex1 = theme === 'dark' ? 0x8b5cf6 : 0x7dd3fc;
    const hex2 = theme === 'dark' ? 0x22d3ee : 0x3b82f6;
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

// Create particle system with minimal count for stable 60 FPS
function createParticles() {
  const particleCount = isMobile ? 12 : 20;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Generate and store mix ratios to ensure consistency across theme changes
  particleMixRatios = [];
  for (let i = 0; i < particleCount; i++) {
    particleMixRatios.push(Math.random());
  }

  const theme = getCurrentTheme();
  const hex1 = theme === 'dark' ? 0x8b5cf6 : 0x7dd3fc;
  const hex2 = theme === 'dark' ? 0x22d3ee : 0x3b82f6;
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
    size: 2,
    vertexColors: true,
    transparent: false, // No transparency for performance
    blending: THREE.NormalBlending,
    sizeAttenuation: true
  });

  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

function init() {
  try {
    console.log('[Three.js] Initializing scene...');
    container = document.getElementById('threejs-container');

    if (!container) {
      console.error('[Three.js] Container element not found!');
      return;
    }

    // CAMERA
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
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
        const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

        textMesh1 = new THREE.Mesh(textGeo, materials);
        textMesh1.position.x = centerOffset;
        textMesh1.position.y = hover;
        textMesh1.position.z = 0;
        textMesh1.rotation.x = 0;
        textMesh1.rotation.y = Math.PI * 2;
        group.add(textMesh1);
        console.log('[Three.js] Text mesh 1 created and added to group');

        if (mirror) {
          textMesh2 = new THREE.Mesh(textGeo, materials);
          textMesh2.position.x = centerOffset;
          textMesh2.position.y = -hover;
          textMesh2.position.z = depth;
          textMesh2.rotation.x = Math.PI;
          textMesh2.rotation.y = Math.PI * 2;
          group.add(textMesh2);
          console.log('[Three.js] Text mesh 2 (mirror) created and added to group');
        }
      } catch (error) {
        console.error('[Three.js] Error creating text geometry:', error);
      }
    }, undefined, function(error) {
      console.error('[Three.js] Error loading font:', error);
    });
  
  // RENDERER - Optimized for stable 60 FPS
    renderer = new THREE.WebGLRenderer({
      antialias: false, // Disabled for performance
      alpha: false, // Keep disabled for performance
      powerPreference: isMobile ? 'low-power' : 'default'
    });
    // Optimized resolution for consistent 60 FPS: 70% on desktop, 85% on mobile
    const pixelRatio = isMobile ? Math.min(window.devicePixelRatio * 0.85, 2) : Math.min(window.devicePixelRatio * 0.7, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    console.log('[Three.js] Renderer created for 60 FPS performance');

    // Create particle system (moderate count for quality)
    createParticles();
    console.log('[Three.js] Particle system created');

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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // Full resolution
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  // Prevent default touch behavior on mobile to avoid page scrolling
  if (isMobile && event.type === 'pointerdown') {
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

  // Auto-rotate if not interacting
  if (!isUserInteracting) {
    targetRotation += autoRotateSpeed;
  }

  // Smooth rotation interpolation
  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

  // Render scene
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
