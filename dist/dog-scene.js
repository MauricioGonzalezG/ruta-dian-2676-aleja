import * as THREE from './vendor/three.module.js';

/** A small, self-contained 3D companion. Call dispose() before replacing its view. */
export function mountDog(container, initialPet = {}, { compact = false } = {}) {
  if (!container || typeof document === 'undefined') return emptyController();
  let pet = normalizePet(initialPet);
  const root = document.createElement('div');
  root.className = 'dog-scene';
  Object.assign(root.style, { position: 'relative', width: '100%', height: '100%', minHeight: compact ? '180px' : '300px', overflow: 'hidden' });
  container.append(root);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return mountFallback(root, pet);
  }

  const canvas = renderer.domElement;
  canvas.className = 'dog-scene-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', `${pet.name}, tu perrito de estudio en 3D. Arrastra a los lados o usa las flechas para girarlo.`);
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', touchAction: 'pan-y', cursor: 'grab', outlineOffset: '-4px' });
  root.append(canvas);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(3.4, 2.8, 6.6);
  camera.lookAt(0, 1.2, 0);
  scene.add(new THREE.HemisphereLight(0xfff9ee, 0x837a6e, 2.5));
  const key = new THREE.DirectionalLight(0xffedcf, 4.2);
  key.position.set(-3.5, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -2.7, right: 2.7, top: 3.6, bottom: -1.5, near: 0.2, far: 12 });
  key.shadow.bias = -0.0015;
  key.shadow.normalBias = 0.035;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd0e7ff, 2.5);
  rim.position.set(3, 3.5, -3);
  scene.add(rim);

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const ownGeometry = geometry => (geometries.add(geometry), geometry);
  const mat = (color, roughness = 0.72, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    materials.add(material);
    return material;
  };
  const fur = mat(0xe6b56e);
  const pale = mat(0xffe4b0);
  const golden = mat(0xb97c3e);
  const earInner = mat(0xd6996c);
  const dark = mat(0x2c2324, 0.21);
  const noseMaterial = mat(0x33282a, 0.35);
  const mouthMaterial = mat(0x714639);
  const pink = mat(0xf08085, 0.48);
  const white = mat(0xfffdf2, 0.22);
  const gold = mat(0xf3bd43, 0.28, { metalness: 0.54 });
  const blue = mat(0x668fdc, 0.65);
  const red = mat(0xd86a65, 0.8);
  const sphere = ownGeometry(new THREE.SphereGeometry(1, 24, 18));
  const tinySphere = ownGeometry(new THREE.SphereGeometry(1, 12, 10));
  const mesh = (geometry, material, parent, position = [0, 0, 0], scale = [1, 1, 1]) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const ball = (material, parent, position, scale, tiny = false) => mesh(tiny ? tinySphere : sphere, material, parent, position, scale);
  const tube = (points, radius, material, parent) => {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(ownGeometry(new THREE.TubeGeometry(curve, 18, radius, 8, false)), material, parent);
  };
  const cylinder = (top, bottom, height, material, parent, position, segments = 32) => mesh(ownGeometry(new THREE.CylinderGeometry(top, bottom, height, segments)), material, parent, position);

  const pedestal = new THREE.Group();
  scene.add(pedestal);
  cylinder(1.18, 1.12, 0.14, mat(0xd8e6d7), pedestal, [0, -0.04, 0]);
  cylinder(1.17, 1.17, 0.035, mat(0xf3f3dc), pedestal, [0, 0.047, 0]);
  // A contact shadow stays pleasantly soft on devices with simple shadow maps.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const context = shadowCanvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 31);
    gradient.addColorStop(0, 'rgba(71,64,45,.34)');
    gradient.addColorStop(0.5, 'rgba(71,64,45,.12)');
    gradient.addColorStop(1, 'rgba(71,64,45,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(shadowCanvas);
    textures.add(texture);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    materials.add(shadowMaterial);
    const shadow = mesh(ownGeometry(new THREE.PlaneGeometry(1.8, 1.3)), shadowMaterial, pedestal, [0, 0.067, 0]);
    shadow.rotation.x = -Math.PI / 2;
    shadow.castShadow = false;
  }

  const turntable = new THREE.Group();
  const puppy = new THREE.Group();
  turntable.add(puppy);
  scene.add(turntable);
  turntable.rotation.y = -0.25;
  const body = ball(fur, puppy, [0, 0.95, -0.04], [0.6, 0.75, 0.49]);
  ball(pale, puppy, [0, 0.88, 0.385], [0.34, 0.49, 0.13]);
  ball(fur, puppy, [-0.43, 0.41, -0.03], [0.32, 0.34, 0.35]);
  ball(fur, puppy, [0.43, 0.41, -0.03], [0.32, 0.34, 0.35]);
  for (const side of [-1, 1]) {
    const leg = ball(fur, puppy, [side * 0.255, 0.53, 0.31], [0.17, 0.42, 0.19]);
    leg.rotation.z = -side * 0.035;
    ball(pale, puppy, [side * 0.27, 0.19, 0.4], [0.23, 0.15, 0.29]);
    ball(pale, puppy, [side * 0.54, 0.18, 0.04], [0.23, 0.13, 0.24]);
    for (const toe of [-1, 1]) tube([[side * 0.27 + toe * 0.063, 0.22, 0.66], [side * 0.27 + toe * 0.063, 0.18, 0.678]], 0.009, golden, puppy);
  }
  const tail = new THREE.Group();
  tail.position.set(0.24, 0.61, -0.39);
  puppy.add(tail);
  tube([[0, 0, 0], [0.18, 0.19, -0.23], [0.42, 0.45, -0.32], [0.53, 0.66, -0.26]], 0.09, fur, tail);
  ball(pale, tail, [0.53, 0.65, -0.265], [0.1, 0.14, 0.1]);

  const head = new THREE.Group();
  head.position.set(0, 1.86, 0.12);
  puppy.add(head);
  ball(fur, head, [0, 0, 0], [0.73, 0.64, 0.59]);
  // Soft floppy ears, with a warm inner surface and rounded tips.
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.61, 0.21, -0.01);
    ear.rotation.z = side * 0.17;
    head.add(ear);
    ball(golden, ear, [side * 0.1, -0.29, -0.025], [0.23, 0.48, 0.18]);
    ball(earInner, ear, [side * 0.09, -0.3, 0.112], [0.145, 0.32, 0.045]);
    ears.push(ear);
  }
  ball(fur, head, [-0.13, 0.58, 0.02], [0.15, 0.15, 0.13]);
  ball(pale, head, [0.025, 0.6, 0.065], [0.14, 0.145, 0.12]);
  ball(fur, head, [0.15, 0.565, 0.02], [0.13, 0.12, 0.11]);
  const eyes = [];
  for (const side of [-1, 1]) {
    ball(golden, head, [side * 0.28, 0.065, 0.485], [0.15, 0.185, 0.1]);
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.28, 0.075, 0.532);
    head.add(eyeGroup);
    ball(dark, eyeGroup, [0, 0, 0], [0.116, 0.135, 0.082]);
    ball(white, eyeGroup, [-0.034, 0.05, 0.071], [0.031, 0.033, 0.015], true);
    ball(white, eyeGroup, [0.03, -0.03, 0.077], [0.013, 0.014, 0.009], true);
    eyes.push(eyeGroup);
    const brow = ball(fur, head, [side * 0.275, 0.255, 0.49], [0.15, 0.055, 0.065]);
    brow.rotation.z = side * -0.12;
    ball(earInner, head, [side * 0.435, -0.175, 0.468], [0.085, 0.047, 0.03], true);
  }
  ball(pale, head, [0, -0.245, 0.478], [0.365, 0.245, 0.23]);
  ball(pale, head, [-0.142, -0.195, 0.585], [0.2, 0.16, 0.13]);
  ball(pale, head, [0.142, -0.195, 0.585], [0.2, 0.16, 0.13]);
  ball(noseMaterial, head, [0, -0.095, 0.718], [0.13, 0.092, 0.075]);
  ball(white, head, [-0.035, -0.064, 0.777], [0.025, 0.011, 0.006], true);
  tube([[0, -0.172, 0.733], [0, -0.27, 0.737], [-0.085, -0.307, 0.721], [-0.16, -0.28, 0.7]], 0.013, mouthMaterial, head);
  tube([[0, -0.27, 0.737], [0.085, -0.307, 0.721], [0.16, -0.28, 0.7]], 0.013, mouthMaterial, head);
  const tongue = ball(pink, head, [0, -0.337, 0.683], [0.092, 0.108, 0.043]);
  tube([[0, -0.316, 0.725], [0, -0.381, 0.723]], 0.005, red, head);

  // Each accessory has its own group so changing clothes needs no reallocation.
  const outfits = {};
  const outfit = (name, parent = puppy) => {
    const group = new THREE.Group();
    parent.add(group);
    outfits[name] = group;
    return group;
  };
  const scarf = outfit('scarf');
  const scarfRing = mesh(ownGeometry(new THREE.TorusGeometry(0.355, 0.075, 10, 28)), red, scarf, [0, 1.37, 0.06]);
  scarfRing.rotation.x = Math.PI / 2;
  ball(red, scarf, [-0.17, 1.32, 0.43], [0.12, 0.095, 0.095]);
  const scarfEnd = ball(red, scarf, [-0.2, 1.115, 0.45], [0.1, 0.24, 0.042]);
  scarfEnd.rotation.z = -0.17;
  ball(mat(0xf59d83), scarf, [-0.185, 0.99, 0.488], [0.09, 0.045, 0.006]);
  const cap = outfit('cap', head);
  const capDome = ownGeometry(new THREE.SphereGeometry(0.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2));
  mesh(capDome, blue, cap, [0, 0.48, 0.035], [1, 0.55, 0.94]);
  ball(blue, cap, [0, 0.49, 0.47], [0.36, 0.045, 0.27]);
  ball(pale, cap, [0, 0.63, 0.36], [0.045, 0.046, 0.018], true);
  ball(blue, cap, [0, 0.735, 0.035], [0.045, 0.035, 0.045], true);
  const sweater = outfit('sweater');
  const sweaterMaterial = mat(0x719b87);
  ball(sweaterMaterial, sweater, [0, 0.985, -0.025], [0.615, 0.58, 0.503]);
  ball(mat(0xabc9a6), sweater, [0, 0.89, 0.465], [0.28, 0.33, 0.018]);
  for (const side of [-1, 1]) ball(sweaterMaterial, sweater, [side * 0.258, 0.85, 0.302], [0.183, 0.2, 0.208]);
  const collar = mesh(ownGeometry(new THREE.TorusGeometry(0.345, 0.055, 8, 28)), sweaterMaterial, sweater, [0, 1.39, 0.04]);
  collar.rotation.x = Math.PI / 2;
  // A little stitched paw on the sweater.
  const stitch = mat(0xffeac6);
  ball(stitch, sweater, [0, 0.9, 0.493], [0.078, 0.065, 0.017], true);
  for (const [x, y] of [[-0.085, 0.998], [-0.03, 1.035], [0.03, 1.035], [0.085, 0.998]]) ball(stitch, sweater, [x, y, 0.489], [0.032, 0.039, 0.015], true);
  const crown = outfit('crown', head);
  const crownRing = mesh(ownGeometry(new THREE.TorusGeometry(0.35, 0.068, 10, 32)), gold, crown, [0, 0.55, 0.015]);
  crownRing.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const x = Math.sin(angle) * 0.34;
    const z = Math.cos(angle) * 0.34 + 0.015;
    mesh(ownGeometry(new THREE.ConeGeometry(0.085, 0.24, 4)), gold, crown, [x, 0.69, z]);
    ball(gold, crown, [x, 0.822, z], [0.032, 0.032, 0.032], true);
  }
  ball(mat(0x7eb7aa, 0.25, { metalness: 0.2 }), crown, [0, 0.586, 0.412], [0.05, 0.055, 0.026], true);

  const bowl = new THREE.Group();
  scene.add(bowl);
  bowl.position.set(-0.66, 0.08, 0.82);
  cylinder(0.245, 0.3, 0.17, mat(0xe78d67), bowl, [0, 0.087, 0]);
  cylinder(0.211, 0.211, 0.01, mat(0x845f44), bowl, [0, 0.178, 0]);
  const bowlRim = mesh(ownGeometry(new THREE.TorusGeometry(0.245, 0.027, 8, 24)), pale, bowl, [0, 0.178, 0]);
  bowlRim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 11; i += 1) {
    const angle = i * 2.4;
    const radius = Math.sqrt(i / 11) * 0.18;
    ball(golden, bowl, [Math.cos(angle) * radius, 0.197 + (i % 3) * 0.005, Math.sin(angle) * radius], [0.034, 0.027, 0.026], true);
  }
  bowl.visible = false;

  const confetti = new THREE.Group();
  scene.add(confetti);
  const confettiGeometry = ownGeometry(new THREE.BoxGeometry(0.047, 0.095, 0.015));
  const confettiMaterials = [0xe18b76, 0x799d83, 0xf0bd53, 0x8ba9d7, 0xfff3d4].map(color => mat(color));
  const confettiPieces = Array.from({ length: compact ? 18 : 28 }, (_, index) => {
    const piece = mesh(confettiGeometry, confettiMaterials[index % confettiMaterials.length], confetti);
    piece.castShadow = false;
    return piece;
  });
  confetti.visible = false;

  const reducedQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = Boolean(reducedQuery?.matches);
  let disposed = false;
  let inViewport = true;
  let visible = !document.hidden;
  let frame = 0;
  let celebrationStart = -100;
  let feedingUntil = -100;
  let previousTime = 0;
  let orbit = -0.25;
  let pointer = null;
  let width = 0;
  let height = 0;
  const startedAt = performance.now();
  const now = () => (performance.now() - startedAt) / 1000;
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  function resize() {
    if (disposed) return;
    const rect = root.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (width !== nextWidth || height !== nextHeight) {
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.set(3.4, 2.8, camera.aspect < 0.7 ? 8.3 : 6.6);
      camera.lookAt(0, 1.2, 0);
      camera.updateProjectionMatrix();
      render();
    }
  }
  function animate(time) {
    frame = 0;
    if (disposed || !visible || reduced) return;
    // Thirty frames per second is enough for this gentle, decorative motion.
    if (time - previousTime >= 1000 / 30) {
      previousTime = time;
      const t = now();
      const celebration = t - celebrationStart;
      const happy = celebration >= 0 && celebration < 2.7;
      const eating = t < feedingUntil;
      const breath = Math.sin(t * 2.2) * 0.012;
      body.scale.y = 0.75 + breath;
      head.position.y = 1.86 + breath;
      head.rotation.z = Math.sin(t * 0.8) * 0.025;
      head.rotation.x = eating ? 0.17 + Math.sin(t * 5) * 0.04 : happy ? -0.045 : 0;
      head.rotation.y = eating ? -0.22 : Math.sin(t * 0.65) * 0.025;
      tail.rotation.z = Math.sin(t * (happy || eating ? 12 : 5)) * (happy || eating ? 0.36 : 0.18);
      tail.rotation.y = Math.sin(t * 5) * 0.15;
      for (let i = 0; i < ears.length; i += 1) ears[i].rotation.z = (i === 0 ? -1 : 1) * (0.17 + Math.sin(t * 2.2) * 0.013);
      const blinkCycle = t % 5.6;
      const blink = blinkCycle > 5.36 ? Math.max(0.08, Math.abs(blinkCycle - 5.48) / 0.12) : 1;
      for (const eye of eyes) eye.scale.y = blink;
      tongue.scale.y = happy ? 0.14 : 0.108;
      const jump = happy && celebration < 1.4 ? Math.abs(Math.sin(celebration * Math.PI * 2.1)) * 0.22 * (1 - celebration / 1.5) : 0;
      puppy.position.y = jump;
      puppy.rotation.z = happy ? Math.sin(celebration * 8) * 0.025 : 0;
      turntable.rotation.y += (orbit - turntable.rotation.y) * 0.18;
      bowl.visible = eating;
      confetti.visible = happy;
      if (happy) {
        confettiPieces.forEach((piece, index) => {
          const angle = index * 2.39996;
          const delay = (index % 6) * 0.035;
          const p = Math.max(0, celebration - delay);
          const radius = 0.27 + p * (0.36 + (index % 4) * 0.07);
          piece.position.set(Math.cos(angle) * radius, 2.5 + p * (0.9 + (index % 3) * 0.22) - p * p * 1.12, Math.sin(angle) * radius);
          piece.rotation.set(p * 3 + index, p * 2, p * 4 + index);
          piece.visible = piece.position.y > 0.1;
        });
      }
      render();
    }
    frame = requestAnimationFrame(animate);
  }
  function startLoop() {
    if (!disposed && !reduced && visible && !frame) frame = requestAnimationFrame(animate);
  }
  function stopLoop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function onMotionChange(event) {
    reduced = event.matches;
    if (reduced) {
      stopLoop();
      puppy.position.y = 0;
      puppy.rotation.z = 0;
      head.rotation.set(0, 0, 0);
      eyes.forEach(eye => { eye.scale.y = 1; });
      confetti.visible = false;
      render();
    } else startLoop();
  }
  const onPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, orbit };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onPointerMove = event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    orbit = pointer.orbit + (event.clientX - pointer.x) * 0.011;
    if (reduced) { turntable.rotation.y = orbit; render(); }
  };
  const onPointerUp = event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointer = null;
    canvas.style.cursor = 'grab';
  };
  const onKeyDown = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home') return;
    event.preventDefault();
    orbit = event.key === 'Home' ? -0.25 : orbit + (event.key === 'ArrowLeft' ? -0.35 : 0.35);
    if (reduced) { turntable.rotation.y = orbit; render(); }
  };
  const onVisibility = () => {
    visible = inViewport && !document.hidden;
    if (visible) startLoop(); else stopLoop();
  };
  const onContextLost = event => {
    event.preventDefault();
    dispose();
    const fallbackRoot = document.createElement('div');
    Object.assign(fallbackRoot.style, { width: '100%', height: '100%', minHeight: compact ? '180px' : '300px' });
    container.append(fallbackRoot);
    lostFallback = mountFallback(fallbackRoot, pet);
  };
  let lostFallback = null;
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);
  reducedQuery?.addEventListener?.('change', onMotionChange);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  observer?.observe(root);
  if (!observer) globalThis.addEventListener('resize', resize);
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    inViewport = entries[0].isIntersecting;
    visible = inViewport && !document.hidden;
    if (visible) startLoop(); else stopLoop();
  }, { rootMargin: '50px' });
  intersection?.observe(root);

  function update(nextPet = {}) {
    if (lostFallback) return lostFallback.update(nextPet);
    if (disposed) return;
    const next = normalizePet({ ...pet, ...nextPet });
    const fedMore = next.fed > pet.fed;
    pet = next;
    Object.entries(outfits).forEach(([name, group]) => { group.visible = name === pet.outfit; });
    canvas.setAttribute('aria-label', `${pet.name}, tu perrito de estudio en 3D. Arrastra a los lados o usa las flechas para girarlo.`);
    if (fedMore) feed();
    render();
  }
  function celebrate() {
    if (lostFallback) return lostFallback.celebrate();
    if (disposed) return;
    celebrationStart = now();
    if (reduced) render(); else startLoop();
  }
  function feed() {
    if (lostFallback) return lostFallback.feed();
    if (disposed) return;
    feedingUntil = now() + 5;
    bowl.visible = true;
    render();
    startLoop();
  }
  function dispose() {
    if (lostFallback) { lostFallback.dispose(); lostFallback = null; }
    if (disposed) return;
    disposed = true;
    stopLoop();
    observer?.disconnect();
    intersection?.disconnect();
    if (!observer) globalThis.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedQuery?.removeEventListener?.('change', onMotionChange);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    root.remove();
  }
  update(pet);
  resize();
  startLoop();
  return { dispose, celebrate, feed, update, supported: true };
}

function normalizePet(pet) {
  const outfits = ['none', 'scarf', 'cap', 'sweater', 'crown'];
  return { name: String(pet.name || 'Toby').slice(0, 30), outfit: outfits.includes(pet.outfit) ? pet.outfit : 'none', fed: Math.max(0, Number(pet.fed) || 0) };
}

function emptyController() {
  return { dispose() {}, celebrate() {}, feed() {}, update() {}, supported: false };
}

function mountFallback(root, initialPet) {
  let pet = normalizePet(initialPet);
  const image = document.createElement('img');
  image.src = new URL('./dog-fallback.svg', import.meta.url).href;
  image.alt = `${pet.name}, tu perrito de estudio`;
  Object.assign(image.style, { display: 'block', width: '100%', height: '100%', minHeight: '180px', maxHeight: '420px', objectFit: 'contain' });
  root.append(image);
  return {
    supported: false,
    dispose() { root.remove(); },
    celebrate() {},
    feed() {},
    update(nextPet) { pet = normalizePet({ ...pet, ...nextPet }); image.alt = `${pet.name}, tu perrito de estudio`; },
  };
}
