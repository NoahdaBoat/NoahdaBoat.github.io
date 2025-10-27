---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<section class="threejs-hero" aria-label="Animated 3D text background">
  <canvas id="threejs-text" data-text="{{ site.title | escape }}"></canvas>
  <div class="threejs-hero__overlay">
    <h1 class="threejs-hero__title">Welcome aboard!</h1>
    <p class="threejs-hero__subtitle">
      Watch the site title sculpted in luminous 3D type swirl through the hero section in real-time.
    </p>
  </div>
</section>

<script src="https://unpkg.com/three@0.161.0/build/three.min.js" integrity="sha384-5xkqVSne+oRDkB+ZPvr/INULbyQDx4et6ct4k6JgkN2mjYGPtSwDPYK9UHpgJ3TO" crossorigin="anonymous"></script>
<script src="https://unpkg.com/three@0.161.0/examples/js/loaders/FontLoader.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/three@0.161.0/examples/js/geometries/TextGeometry.js" crossorigin="anonymous"></script>
<script>
  (function () {
    if (
      typeof THREE === "undefined" ||
      typeof THREE.FontLoader === "undefined" ||
      typeof THREE.TextGeometry === "undefined"
    ) {
      return;
    }

    const canvas = document.getElementById("threejs-text");
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const initialWidth = canvas.clientWidth || 1;
    const initialHeight = canvas.clientHeight || 1;
    renderer.setSize(initialWidth, initialHeight, false);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 200);
    camera.position.set(0, 0, 26);
    camera.aspect = initialWidth / initialHeight;
    camera.updateProjectionMatrix();

    const textGroup = new THREE.Group();
    scene.add(textGroup);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(6, 8, 10);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    rimLight.position.set(-7, -4, 5);
    scene.add(rimLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const loader = new THREE.FontLoader();
    const textString = canvas.dataset.text || "Creative Coding";
    const fontUrl = "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";

    loader.load(
      fontUrl,
      function (font) {
        const textGeometry = new THREE.TextGeometry(textString, {
          font,
          size: 3.75,
          height: 1.3,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.35,
          bevelSize: 0.3,
          bevelOffset: 0,
          bevelSegments: 5,
        });
        textGeometry.center();

        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0x0f172a,
          roughness: 0.38,
          metalness: 0.55,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textGroup.add(textMesh);

        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
        });
        const textEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(textGeometry),
          edgeMaterial
        );
        textGroup.add(textEdges);
      },
      undefined,
      function () {
        console.warn("Three.js font failed to load: " + fontUrl);
      }
    );

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

      textGroup.rotation.y = time * 0.45;
      textGroup.rotation.x = Math.sin(time * 0.45) * 0.25;
      textGroup.rotation.z = Math.sin(time * 0.3) * 0.1;

      renderer.render(scene, camera);
    }

    handleResize();
    render(0);

    window.addEventListener("resize", handleResize);
  })();
</script>
