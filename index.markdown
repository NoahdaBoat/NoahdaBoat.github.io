---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<section class="threejs-hero" aria-label="Animated cube background">
  <canvas id="threejs-cube"></canvas>
  <div class="threejs-hero__overlay">
    <h1 class="threejs-hero__title">Welcome aboard!</h1>
    <p class="threejs-hero__subtitle">
      Enjoy this interactive Three.js cube spinning in real-time right on the homepage.
    </p>
  </div>
</section>

<script src="https://unpkg.com/three@0.161.0/build/three.min.js" integrity="sha384-5xkqVSne+oRDkB+ZPvr/INULbyQDx4et6ct4k6JgkN2mjYGPtSwDPYK9UHpgJ3TO" crossorigin="anonymous"></script>
<script>
  (function () {
    if (typeof THREE === "undefined") {
      return;
    }

    const canvas = document.getElementById("threejs-cube");
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      emissive: 0x041830,
      roughness: 0.35,
      metalness: 0.15,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const fillLight = new THREE.DirectionalLight(0x4dabf7, 0.6);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    function resizeRendererToDisplaySize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      const needResize =
        canvas.width !== Math.floor(width * pixelRatio) ||
        canvas.height !== Math.floor(height * pixelRatio);

      if (needResize) {
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
      }

      return needResize;
    }

    function handleResize() {
      if (resizeRendererToDisplaySize()) {
        const { clientWidth, clientHeight } = canvas;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      }
    }

    function render(time) {
      time *= 0.001;
      requestAnimationFrame(render);

      handleResize();

      cube.rotation.x = time * 0.7;
      cube.rotation.y = time * 1.1;

      renderer.render(scene, camera);
    }

    handleResize();
    render(0);

    window.addEventListener("resize", handleResize);
  })();
</script>
