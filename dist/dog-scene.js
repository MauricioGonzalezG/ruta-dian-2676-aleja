import * as THREE from './vendor/three.module.js';

/**
 * Procedural 3D puppy. mountDog(element, { name, outfit, fed }, { compact }) returns
 * update(), feed(), celebrate(), play('pet'|'play'|'sleep'|'stretch'|'sit'), dispose(),
 * getAnimationState() -> { action, phase, elapsed, busy }, and supported.
 * Feed: 8 s, anticipate / sniff / eat / lick / satisfied, then idle. Sleep persists.
 * Timelines pause outside the viewport. Reduced motion uses static poses and ARIA.
 */
export function mountDog(container, initialPet = {}, { compact = false } = {}) {
  if (!container || typeof document === 'undefined') return emptyController();
  let pet = normalizePet(initialPet);
  const root = document.createElement('div'); root.className = 'dog-scene';
  Object.assign(root.style, { position: 'relative', width: '100%', height: '100%', minHeight: compact ? '180px' : '300px', overflow: 'hidden' }); container.append(root);
  const status = document.createElement('span'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  Object.assign(status.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }); root.append(status);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return mountFallback(root, pet, status); }
  const canvas = renderer.domElement; canvas.className = 'dog-scene-canvas'; canvas.setAttribute('role', 'img'); canvas.setAttribute('tabindex', '0');
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', touchAction: 'pan-y', cursor: 'grab', outlineOffset: '-4px' }); root.append(canvas);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5)); renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geometry = value => (geometries.add(value), value);
  const material = (color, roughness = .7, options = {}) => { const value = new THREE.MeshStandardMaterial({ color, roughness, ...options }); materials.add(value); return value; };
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .1, 35); camera.position.set(3.15, 2.64, 6.2); camera.lookAt(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xfff9ec, 0x697f74, 2.2));
  const key = new THREE.DirectionalLight(0xffeed9, 3.6); key.position.set(-3.5, 6, 5); key.castShadow = true; key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3.8, bottom: -1.5, near: .2, far: 12 }); key.shadow.bias = -.001; key.shadow.normalBias = .025; scene.add(key);
  const rim = new THREE.DirectionalLight(0xd0e7ff, 2.5); rim.position.set(3, 4, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff8ed, .6); fill.position.set(0, 2, 5); scene.add(fill);
  const sphere = geometry(new THREE.SphereGeometry(1, 24, 18)), smallSphere = geometry(new THREE.SphereGeometry(1, 12, 8));
  const fur = material(0xe8b675), cream = material(0xffeac1), toasted = material(0xbd834c), earPink = material(0xd8a282);
  const dark = material(0x25252b, .19), warmDark = material(0x74563e), white = material(0xfffdf7, .24), pink = material(0xee9298, .46);
  const gold = material(0xedbb58, .27, { metalness: .56 }), teal = material(0x638e81), lightTeal = material(0x9bb7a0), terracotta = material(0xd67b6b);
  let randomSeed = 49271; const random = () => { randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0; return randomSeed / 4294967296; };
  const mesh = (g, m, parent, position = [0, 0, 0], scale = [1, 1, 1], shadow = true) => { const value = new THREE.Mesh(g, m); value.position.set(...position); value.scale.set(...scale); value.castShadow = shadow; value.receiveShadow = shadow; parent.add(value); return value; };
  const ball = (m, p, position, scale, tiny = false) => mesh(tiny ? smallSphere : sphere, m, p, position, scale);
  const group = (parent, position = [0, 0, 0]) => { const value = new THREE.Group(); value.position.set(...position); parent.add(value); return value; };
  const tube = (points, radius, m, parent, closed = false) => mesh(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)), closed), closed ? 48 : 16, radius, 6, closed)), m, parent);
  const ring = (radius, thickness, m, parent, position, horizontal = true) => { const value = mesh(geometry(new THREE.TorusGeometry(radius, thickness, 8, 32)), m, parent, position); if (horizontal) value.rotation.x = Math.PI / 2; return value; };
  const cylinder = (top, bottom, height, m, parent, position, segments = 32) => mesh(geometry(new THREE.CylinderGeometry(top, bottom, height, segments)), m, parent, position);
  function canvasTexture(width, height, draw) { const element = document.createElement('canvas'); element.width = width; element.height = height; const ctx = element.getContext('2d'); if (ctx) draw(ctx); const value = new THREE.CanvasTexture(element); value.colorSpace = THREE.SRGBColorSpace; textures.add(value); return value; }
  const ellipsePoints = (rx, rz, y, z = 0, count = 40) => Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count) * rx, y, Math.sin(i * Math.PI * 2 / count) * rz + z]);
  const pedestal = group(scene); cylinder(1.57, 1.51, .12, material(0xdbe5d5), pedestal, [0, -.035, 0]); cylinder(1.565, 1.565, .035, material(0xf0f0dc), pedestal, [0, .043, 0]); ring(1.53, .012, material(0xc5d6c4), pedestal, [0, .008, 0]);
  const shadowTexture = canvasTexture(64, 64, ctx => { const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 31); gradient.addColorStop(0, 'rgba(61,63,44,.28)'); gradient.addColorStop(1, 'rgba(61,63,44,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64); });
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }); materials.add(shadowMaterial);
  const contactShadow = mesh(geometry(new THREE.PlaneGeometry(2.7, 2.5)), shadowMaterial, pedestal, [0, .066, 0], [1, 1, 1], false); contactShadow.rotation.x = -Math.PI / 2;
  const turntable = group(scene); turntable.rotation.y = -.24;
  // Bed and toys rotate with the puppy, preserving the feeding contacts.
  const bed = group(turntable, [0, .09, -.19]); ball(teal, bed, [0, .065, 0], [.99, .12, .69]); ball(lightTeal, bed, [0, .118, -.015], [.87, .074, .59]);
  const piping = material(0xe1d9b3); tube(ellipsePoints(.94, .655, .095), .013, piping, bed, true);
  for (const side of [-1, 1]) ball(teal, bed, [side * .84, .16, -.03], [.155, .14, .52]); ball(teal, bed, [0, .17, -.56], [.74, .16, .14]);
  const stitches = new THREE.InstancedMesh(geometry(new THREE.CapsuleGeometry(.004, .025, 2, 4)), piping, 46); bed.add(stitches); const dummy = new THREE.Object3D();
  for (let i = 0; i < 46; i += 1) { const a = i * Math.PI * 2 / 46; dummy.position.set(Math.cos(a) * .97, .102, Math.sin(a) * .67); dummy.rotation.set(Math.PI / 2, 0, -a); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); stitches.setMatrixAt(i, dummy.matrix); }
  for (const x of [-.45, 0, .45]) ball(teal, bed, [x, .19, -.25], [.018, .008, .018], true);
  const bone = group(turntable, [-1.0, .15, .32]); bone.rotation.y = -.4; const boneMat = material(0xffe6b2, .86);
  const boneBar = mesh(geometry(new THREE.CapsuleGeometry(.045, .23, 3, 10)), boneMat, bone); boneBar.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) for (const z of [-.038, .038]) ball(boneMat, bone, [side * .165, 0, z], [.068, .045, .065], true);
  const toyBall = group(turntable, [1.04, .238, .65]); ball(material(0x80aaa8, .66), toyBall, [0, 0, 0], [.17, .17, .17]); ring(.163, .016, terracotta, toyBall, [0, 0, 0], false);
  const ballBand = ring(.163, .012, cream, toyBall, [0, 0, 0], false); ballBand.rotation.y = Math.PI / 2;
  tube(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return [Math.sin(a) * .168, Math.cos(a) * .168, 0]; }), .003, material(0x528b87), toyBall, true);
  const puppy = group(turntable), bodyRig = group(puppy, [0, .95, -.04]);
  ball(fur, bodyRig, [0, 0, 0], [.60, .75, .49]); const chestPatch = ball(cream, bodyRig, [0, -.07, .425], [.34, .5, .13]); ball(cream, bodyRig, [0, .42, .27], [.245, .22, .14]);
  const hindLegs = [], frontLegs = [], paws = [], nail = material(0xcba980, .38), pads = material(0x94694c);
  for (const side of [-1, 1]) {
    const hind = group(puppy, [side * .44, .41, -.03]); ball(fur, hind, [0, 0, 0], [.31, .34, .34]); hindLegs.push(hind);
    const leg = group(puppy, [side * .255, .53, .31]); ball(fur, leg, [0, 0, 0], [.17, .42, .19]); ball(cream, leg, [0, -.28, .02], [.165, .12, .19]); frontLegs.push(leg);
    const paw = group(puppy, [side * .27, .20, .40]); ball(cream, paw, [0, 0, 0], [.23, .15, .29]); ball(pads, paw, [0, -.13, -.005], [.095, .022, .115], true);
    for (const toe of [-1, 0, 1]) { ball(cream, paw, [toe * .093, -.002, .185], [.072, .085, .105], true); ball(nail, paw, [toe * .093, -.018, .269], [.018, .027, .025], true); ball(pads, paw, [toe * .085, -.119, .14], [.035, .015, .035], true); }
    paws.push(paw); ball(cream, hind, [side * .095, -.22, .065], [.23, .125, .245]);
  }
  const tail = group(puppy, [.24, .61, -.39]); tube([[0, 0, 0], [.18, .19, -.23], [.42, .44, -.32], [.53, .65, -.26]], .09, fur, tail); ball(cream, tail, [.53, .65, -.265], [.11, .145, .105]);
  for (let i = 0; i < 5; i += 1) ball(cream, tail, [.50 + i * .013, .66 + i * .025, -.26], [.035, .067, .034], true);
  const head = group(puppy, [0, 1.86, .12]); ball(fur, head, [0, 0, 0], [.73, .64, .59]); ball(cream, head, [0, -.19, .3], [.42, .36, .24]);
  const ears = [];
  for (const side of [-1, 1]) { const ear = group(head, [side * .61, .21, -.01]); ear.rotation.z = side * .17; ball(toasted, ear, [side * .10, -.29, -.025], [.23, .48, .18]); ball(earPink, ear, [side * .09, -.30, .112], [.145, .32, .045]);
    for (let i = 0; i < 3; i += 1) tube([[side * .03 + i * side * .042, -.17, .155], [side * .06 + i * side * .04, -.37, .158], [side * .10 + i * side * .035, -.49, .14]], .004, toasted, ear);
    for (let i = 0; i < 4; i += 1) ball(toasted, ear, [side * (.05 + i * .04), -.67, -.02], [.04, .08, .045], true); ears.push(ear);
  }
  const tuftGeometry = geometry(new THREE.CapsuleGeometry(.009, .047, 3, 6));
  function furLocks(parent, radii, count, skipFace) {
    const locks = new THREE.InstancedMesh(tuftGeometry, fur, count); locks.castShadow = false; parent.add(locks); const up = new THREE.Vector3(0, 1, 0), normal = new THREE.Vector3(), flow = new THREE.Vector3();
    for (let i = 0; i < count; i += 1) { let x, y, z; do { const a = random() * Math.PI * 2, v = random() * 2 - 1, r = Math.sqrt(1 - v * v); x = Math.cos(a) * r; y = v; z = Math.sin(a) * r; } while (skipFace && z > .32 && y < .75 && y > -.65);
      normal.set(x / radii[0], y / radii[1], z / radii[2]).normalize(); dummy.position.set(x * radii[0] * 1.003, y * radii[1] * 1.003, z * radii[2] * 1.003);
      // Fur flows down the surface instead of jutting out like spikes.
      flow.set(0, -1, 0).addScaledVector(normal, normal.y);
      if (flow.lengthSq() < .01) flow.set(1, 0, 0); flow.normalize().addScaledVector(normal, .16).normalize();
      dummy.quaternion.setFromUnitVectors(up, flow); dummy.scale.set(.7 + random() * .3, .7 + random() * .4, .65 + random() * .25); dummy.updateMatrix(); locks.setMatrixAt(i, dummy.matrix);
    } return locks;
  }
  furLocks(head, [.726, .64, .59], compact ? 62 : 90, true); furLocks(bodyRig, [.59, .74, .487], compact ? 46 : 72, false);
  for (const [x, y, z, tilt] of [[-.14, .59, .04, -.35], [.005, .63, .04, -.1], [.15, .585, .02, .3]]) { const lock = ball(x === .005 ? cream : fur, head, [x, y, z], [.095, .16, .1]); lock.rotation.z = tilt; }
  const eyeGroups = [], lids = [], iris = material(0x775735, .25), pupil = material(0x161d22, .13);
  for (const side of [-1, 1]) {
    ball(toasted, head, [side * .28, .075, .49], [.153, .182, .09]); const eye = group(head, [side * .28, .078, .536]); ball(dark, eye, [0, 0, 0], [.116, .135, .078]);
    ball(iris, eye, [0, -.008, .065], [.091, .103, .024]); ball(pupil, eye, [0, -.008, .083], [.064, .085, .011]); ball(white, eye, [-.034, .052, .087], [.029, .032, .012], true); ball(white, eye, [.031, -.033, .091], [.013, .014, .007], true); eyeGroups.push(eye);
    lids.push(ball(fur, head, [side * .28, .216, .549], [.132, .024, .052])); ball(fur, head, [side * .28, -.061, .517], [.13, .018, .043]); const brow = ball(cream, head, [side * .275, .279, .493], [.136, .044, .052]); brow.rotation.z = side * -.12; ball(earPink, head, [side * .435, -.17, .479], [.081, .045, .019], true);
  }
  ball(cream, head, [-.143, -.195, .585], [.205, .161, .138]); ball(cream, head, [.143, -.195, .585], [.205, .161, .138]);
  const noseTexture = canvasTexture(64, 64, ctx => { ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 64, 64); for (let i = 0; i < 330; i += 1) { ctx.fillStyle = random() > .5 ? '#aaa' : '#666'; ctx.beginPath(); ctx.arc(random() * 64, random() * 64, .6 + random(), 0, Math.PI * 2); ctx.fill(); } }); noseTexture.colorSpace = THREE.NoColorSpace;
  const noseMat = material(0x3c3132, .32, { bumpMap: noseTexture, bumpScale: .011 }); ball(noseMat, head, [0, -.092, .722], [.133, .095, .073]);
  for (const side of [-1, 1]) ball(dark, head, [side * .059, -.102, .782], [.020, .012, .006], true); ball(white, head, [-.031, -.056, .775], [.028, .009, .006], true); tube([[0, -.17, .733], [0, -.254, .733]], .011, warmDark, head);
  for (const side of [-1, 1]) { tube([[0, -.258, .729], [side * .084, -.282, .721], [side * .164, -.257, .697]], .009, warmDark, head);
    for (let i = 0; i < 3; i += 1) { ball(toasted, head, [side * (.188 + i * .035), -.186 - (i % 2) * .051, .69 - i * .011], [.009, .009, .006], true); const whisker = tube([[side * .222, -.235 - i * .025, .664], [side * .35, -.218 - i * .035, .648], [side * .47, -.18 - i * .046, .615]], .0023, warmDark, head); whisker.castShadow = false; }
  }
  const jaw = group(head, [0, -.285, .60]); ball(dark, jaw, [0, -.018, .06], [.177, .064, .115]); ball(cream, jaw, [0, -.075, .018], [.222, .082, .166]);
  const tongue = group(jaw, [0, -.026, .152]), tongueMesh = ball(pink, tongue, [0, 0, 0], [.087, .068, .029]); tube([[0, -.014, .03], [0, -.062, .026]], .0035, terracotta, tongue);
  const collar = group(head, [0, -.46, -.035]); ring(.365, .036, teal, collar, [0, 0, 0]); const buckle = mesh(geometry(new THREE.BoxGeometry(.10, .065, .026)), gold, collar, [.30, -.004, .18]); buckle.rotation.y = .8; ring(.029, .008, gold, collar, [0, -.043, .363], false);
  const tag = cylinder(.087, .087, .026, gold, collar, [0, -.118, .366], 24); tag.rotation.x = Math.PI / 2;
  const tagMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }); materials.add(tagMaterial); mesh(geometry(new THREE.PlaneGeometry(.148, .055)), tagMaterial, collar, [0, -.117, .383], [1, 1, 1], false); let nameTexture = null;
  function nameTag() { if (nameTexture) { nameTexture.dispose(); textures.delete(nameTexture); } nameTexture = canvasTexture(256, 90, ctx => { ctx.fillStyle = '#5d4830'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${pet.name.length > 9 ? 24 : 34}px Arial, sans-serif`; ctx.fillText(pet.name.slice(0, 14), 128, 46, 244); }); tagMaterial.map = nameTexture; tagMaterial.needsUpdate = true; }
  const outfits = {}, outfit = (name, parent) => (outfits[name] = group(parent));
  const scarf = outfit('scarf', head); ring(.38, .057, terracotta, scarf, [0, -.425, -.015]); const knot = ball(terracotta, scarf, [-.17, -.43, .34], [.11, .085, .08]); knot.rotation.z = -.3; const scarfTip = ball(terracotta, scarf, [-.17, -.60, .36], [.11, .23, .028]); scarfTip.rotation.z = -.15;
  tube([[-.25, -.46, .392], [-.25, -.65, .392], [-.16, -.77, .392]], .005, cream, scarf); for (let i = 0; i < 5; i += 1) tube([[-.255 + i * .034, -.776, .363], [-.259 + i * .034, -.824, .369]], .008, terracotta, scarf);
  const cap = outfit('cap', head), blue = material(0x7190bd), navy = material(0x526b98); mesh(geometry(new THREE.SphereGeometry(.46, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)), blue, cap, [0, .48, .04], [1, .60, .94]); ring(.44, .016, navy, cap, [0, .485, .04]); ball(blue, cap, [0, .485, .48], [.365, .034, .285]);
  const brimLine = tube(Array.from({ length: 20 }, (_, i) => { const a = i / 19 * Math.PI; return [Math.cos(a) * .34, .49, .48 + Math.sin(a) * .255]; }), .007, cream, cap); brimLine.castShadow = false;
  for (let i = 0; i < 5; i += 1) { const a = i / 5 * Math.PI * 2; tube(Array.from({ length: 12 }, (_, j) => { const b = j / 11 * Math.PI / 2; return [Math.sin(b) * .463 * Math.cos(a), .48 + Math.cos(b) * .276, .04 + Math.sin(b) * .438 * Math.sin(a)]; }), .0045, navy, cap); }
  ball(navy, cap, [0, .763, .04], [.036, .022, .035], true); ball(cream, cap, [0, .625, .402], [.062, .055, .015], true);
  const sweater = outfit('sweater', bodyRig), knitTexture = canvasTexture(64, 64, ctx => { ctx.fillStyle = '#a4b7a4'; ctx.fillRect(0, 0, 64, 64); ctx.strokeStyle = '#839681'; ctx.lineWidth = 1.5; for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 6); ctx.lineTo(x + 8, y); ctx.stroke(); } });
  knitTexture.colorSpace = THREE.NoColorSpace; knitTexture.wrapS = knitTexture.wrapT = THREE.RepeatWrapping; knitTexture.repeat.set(5, 5); const knit = material(0x779880, .93, { bumpMap: knitTexture, bumpScale: .009 });
  ball(knit, sweater, [0, .015, 0], [.62, .63, .56]);
  mesh(geometry(new THREE.SphereGeometry(1, 14, 12, Math.PI / 2 - .40, .80, Math.PI / 2 - .48, .96)), lightTeal, sweater, [0, .015, 0], [.625, .635, .568]);
  for (const side of [-1, 1]) ball(knit, sweater, [side * .27, -.11, .30], [.177, .22, .208]); ring(.37, .045, teal, sweater, [0, .43, .04]);
  tube([[-.38, -.28, .358], [-.28, -.39, .350], [0, -.42, .407], [.28, -.39, .350], [.38, -.28, .358]], .015, teal, sweater); for (const x of [-.48, .48]) tube([[x, -.27, .30], [x, .03, .36], [x * .83, .26, .37]], .006, cream, sweater);
  ball(cream, sweater, [0, -.04, .59], [.078, .063, .016], true); for (const [x, y] of [[-.085, .055], [-.03, .09], [.03, .09], [.085, .055]]) ball(cream, sweater, [x, y, .59], [.031, .037, .013], true);
  const crown = outfit('crown', head); ring(.355, .061, gold, crown, [0, .55, .02]); ring(.354, .008, cream, crown, [0, .525, .02]);
  for (let i = 0; i < 5; i += 1) { const a = i / 5 * Math.PI * 2, x = Math.sin(a) * .34, z = Math.cos(a) * .34 + .02; const point = mesh(geometry(new THREE.ConeGeometry(.085, .23, 4)), gold, crown, [x, .69, z]); point.rotation.y = a; ball(gold, crown, [x, .819, z], [.029, .029, .029], true); ball(i % 2 ? terracotta : lightTeal, crown, [x * 1.12, .57, (z - .02) * 1.12 + .02], [.025, .036, .018], true); }
  // Lathed closed profile: ceramic exterior, rounded rim, real cavity and inner floor.
  const bowl = group(turntable, [-1.12, .067, .86]), ceramic = material(0x86aaa9, .3);
  const bowlProfile = [[0, 0], [.23, 0], [.293, .025], [.306, .075], [.278, .192], [.250, .21], [.228, .195], [.203, .077], [0, .077]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(geometry(new THREE.LatheGeometry(bowlProfile, 40)), ceramic, bowl); ring(.251, .020, cream, bowl, [0, .202, 0]); ring(.262, .009, teal, bowl, [0, .026, 0]);
  const print = material(0x416f6a, .62); ball(print, bowl, [0, .092, .30], [.036, .028, .004], true); for (const [x, y] of [[-.038, .137], [-.013, .153], [.013, .153], [.038, .137]]) ball(print, bowl, [x, y, .29], [.012, .014, .004], true);
  const kibble = new THREE.InstancedMesh(geometry(new THREE.IcosahedronGeometry(.032, 1)), material(0xffffff, .92), 24); bowl.add(kibble);
  for (let i = 0; i < 24; i += 1) { const a = i * 2.39996, r = Math.sqrt(i / 24) * .178; dummy.position.set(Math.cos(a) * r, .113 + (i % 4) * .019, Math.sin(a) * r); dummy.rotation.set(random(), random() * 2, random()); dummy.scale.set(1 + random() * .28, .75 + random() * .2, .9 + random() * .2); dummy.updateMatrix(); kibble.setMatrixAt(i, dummy.matrix); kibble.setColorAt(i, new THREE.Color([0x9e613a, 0xc4894f, 0xb37342][i % 3])); } kibble.count = 0;
  const confetti = group(turntable), confettiGeometry = geometry(new THREE.BoxGeometry(.04, .079, .012)), confettiColors = [terracotta, teal, gold, material(0x91acd3), cream];
  const confettiPieces = Array.from({ length: compact ? 18 : 28 }, (_, i) => mesh(confettiGeometry, confettiColors[i % 5], confetti, [0, 0, 0], [1, 1, 1], false)); confetti.visible = false;
  const sparkleShape = new THREE.Shape(); for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4, r = i % 2 ? .016 : .05, x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) sparkleShape.moveTo(x, y); else sparkleShape.lineTo(x, y); } sparkleShape.closePath();
  const sparkles = group(turntable), sparkleGeometry = geometry(new THREE.ShapeGeometry(sparkleShape)); const sparklePieces = Array.from({ length: 7 }, () => mesh(sparkleGeometry, gold, sparkles, [0, 0, 0], [1, 1, 1], false)); sparkles.visible = false;
  const zTexture = canvasTexture(64, 64, ctx => { ctx.fillStyle = '#648d84'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 48px Arial, sans-serif'; ctx.fillText('Z', 32, 34); });
  const zMat = new THREE.SpriteMaterial({ map: zTexture, transparent: true, depthWrite: false }); materials.add(zMat); const zzz = group(turntable); const zSprites = Array.from({ length: 3 }, () => { const sprite = new THREE.Sprite(zMat); zzz.add(sprite); return sprite; }); zzz.visible = false;
  const reducedQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)'); let reduced = Boolean(reducedQuery?.matches), disposed = false, inViewport = true, visible = !document.hidden;
  let frame = 0, lastTime = 0, clock = 0, orbit = -.24, pointer = null, width = 0, height = 0, lostFallback = null;
  let action = 'idle', phase = 'idle', actionStart = 0, actionElapsed = 0, staticAction = false, lastKibbleCount = -1;
  const durations = { feed: 8, pet: 4.4, play: 6.6, stretch: 4.6, sit: .8, celebrate: 3.2 };
  const basePose = { bodyY: .95, bodyZ: -.04, bodySY: 1, bodyRX: 0, headX: 0, headY: 1.86, headZ: .12, headRX: 0, headRY: 0, headRZ: 0, hindY: .41, hindZ: -.03, legY: .53, legZ: .31, legSY: 1, legRX: 0, pawY: .20, pawZ: .40, leftLift: 0, rightLift: 0, rootY: 0, rootRZ: 0, jawOpen: .08, tongueOut: .32, tongueSide: 0, eyes: 1, earTilt: .17, tailSpeed: 5, tailRange: .18 };
  const currentPose = { ...basePose }, smooth = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); }, mix = (a, b, t) => a + (b - a) * t;
  const announce = text => { status.textContent = `${pet.name} ${text}`; };
  const setPhase = next => { if (phase !== next || canvas.dataset.phase !== next) { phase = next; canvas.dataset.phase = next; } if (canvas.dataset.action !== action) canvas.dataset.action = action; };
  function begin(nextAction) {
    if (lostFallback) return nextAction === 'feed' ? lostFallback.feed() : nextAction === 'celebrate' ? lostFallback.celebrate() : lostFallback.play(nextAction);
    if (disposed || (nextAction === 'feed' && action === 'feed' && !staticAction)) return false;
    action = nextAction; actionStart = clock; actionElapsed = 0; staticAction = reduced;
    const messages = { feed: 'se acerca a su comida. Comerá, se relamerá y volverá a sentarse.', pet: 'disfruta tus caricias.', play: 'juega con su pelota.', sleep: 'se acomoda en su cama para dormir.', stretch: 'estira las patas.', sit: 'vuelve a sentarse.', celebrate: 'celebra contigo. ¡Buen trabajo!' }; announce(messages[nextAction] || 'te acompaña.');
    if (reduced) { actionElapsed = nextAction === 'sleep' ? 1 : durations[nextAction] || 0; step(0, true); render(); if (nextAction === 'feed') announce('ha comido todas las croquetas y está satisfecho.'); } else { step(0); render(); startLoop(); } return true;
  }
  function feed() { return begin('feed'); } function celebrate() { return begin('celebrate'); }
  function play(nextAction) { return ['pet', 'play', 'sleep', 'stretch', 'sit'].includes(nextAction) ? begin(nextAction) : false; }
  function getAnimationState() { if (lostFallback) return lostFallback.getAnimationState(); return { action, phase, elapsed: Math.round(actionElapsed * 1000) / 1000, busy: !disposed && !staticAction && action !== 'idle' && action !== 'sleep' }; }
  function desiredPose() {
    const pose = { ...basePose }, e = actionElapsed, motion = reduced ? 0 : 1; bowl.position.set(-1.12, .067, .86); toyBall.position.set(1.04, .238, .65); toyBall.rotation.set(0, 0, 0); confetti.visible = false; sparkles.visible = false; zzz.visible = false; let foodCount = 0;
    if (action === 'feed') {
      const arrive = smooth(e / .8), lower = smooth((e - .8) / 1.3), rise = smooth((e - 5.9) / 1.25), eating = e >= 2.1 && e < 5.9;
      setPhase(e < .8 ? 'anticipate' : e < 2.1 ? 'sniff' : e < 5.9 ? 'eat' : e < 6.7 ? 'lick' : 'satisfied'); const returning = smooth((e - 7.15) / .85);
      bowl.position.x = mix(mix(-1.12, 0, arrive), -1.12, returning); bowl.position.z = mix(mix(.86, 1.16, arrive), .86, returning);
      const crouch = lower * (1 - rise); pose.bodyY = mix(.95, .73, crouch); pose.bodyZ = mix(-.04, -.13, crouch); pose.bodySY = mix(1, .80, crouch); pose.bodyRX = .13 * crouch;
      pose.headY = mix(1.86, 1.015, crouch); pose.headZ = mix(.12, .775, crouch); pose.headRX = mix(0, .735, crouch); pose.headRY = (1 - arrive) * -.25 + (e < 2.1 ? Math.sin(e * 13) * .03 * motion : 0);
      pose.legY = mix(.53, .41, crouch); pose.legSY = mix(1, .69, crouch); pose.legZ = mix(.31, .43, crouch); pose.legRX = .17 * crouch; pose.pawZ = mix(.40, .53, crouch); pose.hindY = mix(.41, .34, crouch); pose.tailSpeed = 10; pose.tailRange = .30;
      if (eating) { pose.headY += Math.sin(e * 13) * .014 * motion; pose.headRX += Math.sin(e * 13) * .018 * motion; pose.jawOpen = .10 + (Math.sin(e * 13) + 1) * .105 * motion; pose.tongueOut = .1; foodCount = Math.max(0, 24 - Math.floor((e - 2.1) / 3.8 * 24)); }
      else if (e < 2.1) { foodCount = 24; pose.jawOpen = .04; pose.tongueOut = 0; }
      else { pose.jawOpen = .07; pose.tongueOut = e < 7.1 ? .74 + Math.sin(e * 12) * .2 * motion : .32; pose.tongueSide = e < 7.1 ? Math.sin(e * 10) * .07 * motion : 0; pose.headRZ = e > 6.7 ? -.055 : 0; }
    } else if (action === 'pet') {
      setPhase(e < .6 ? 'anticipate' : 'content'); const lean = reduced ? 1 : Math.sin(Math.min(1, e / 4.4) * Math.PI); pose.headRZ = -.18 * lean; pose.headRX = -.12 * lean; pose.eyes = .63; pose.tailSpeed = 9; pose.tailRange = .27; pose.tongueOut = .35; sparkles.visible = true;
      sparklePieces.forEach((piece, i) => { const t = reduced ? i / 7 : (e * .5 + i / 7) % 1; piece.position.set(Math.sin(i * 2.4) * (.77 + t * .2), 1.7 + t * .85, .3 + Math.cos(i * 2.4) * .3); piece.rotation.set(0, .45, e * motion + i); piece.scale.setScalar(reduced ? .8 : Math.sin(t * Math.PI) * 1.1); });
    } else if (action === 'play') {
      setPhase(e < .65 ? 'anticipate' : e < 5.4 ? 'playing' : 'satisfied'); const run = reduced ? .5 : Math.max(0, Math.min(1, (e - .6) / 4.8)), arc = Math.sin(run * Math.PI * 3), lift = reduced ? 0 : Math.abs(Math.sin(run * Math.PI * 5)) * .43;
      toyBall.position.set(mix(1.04, .66, smooth(run)) + arc * .40, .238 + lift, .65 + Math.sin(run * Math.PI) * .45); toyBall.rotation.set(run * 6, run * 8, run * 4);
      pose.headRY = Math.atan2(toyBall.position.x, toyBall.position.z + .25) * .42; pose.headRX = .09 - lift * .17; pose.headRZ = Math.sin(e * 3) * .065 * motion; pose.rightLift = reduced ? .18 : Math.max(0, Math.sin(e * 4)) * .28; pose.rootRZ = Math.sin(e * 4) * .018 * motion; pose.rootY = e > 2 && e < 4.8 ? Math.max(0, Math.sin(e * 5)) * .065 * motion : 0;
      pose.eyes = 1; pose.jawOpen = .16; pose.tongueOut = .65; pose.tailSpeed = 12; pose.tailRange = .34;
    } else if (action === 'sleep') {
      setPhase(e < 1.2 && !reduced ? 'settling' : 'sleeping'); pose.bodyY = .53; pose.bodyZ = -.10; pose.bodySY = .55; pose.bodyRX = -.08; pose.headX = .16; pose.headY = .735; pose.headZ = .46; pose.headRX = -.07; pose.headRZ = .16; pose.hindY = .29; pose.hindZ = -.15; pose.legY = .25; pose.legZ = .49; pose.legSY = .55; pose.legRX = 1.26; pose.pawY = .175; pose.pawZ = .72; pose.eyes = .055; pose.jawOpen = 0; pose.tongueOut = 0; pose.tailRange = .025; pose.tailSpeed = 1; pose.earTilt = .26;
      zzz.visible = true; zSprites.forEach((sprite, i) => { const p = reduced ? i / 3 : (e * .18 + i / 3) % 1; sprite.position.set(.6 + p * .34, 1.18 + p * .7, .56); sprite.scale.setScalar(.105 + p * .11); });
    } else if (action === 'stretch') {
      setPhase(e < .8 ? 'anticipate' : e < 3.6 ? 'stretching' : 'satisfied'); const stretch = reduced ? 1 : smooth(e / .8) * (1 - smooth((e - 3.5) / 1.1)); pose.bodyY = mix(.95, .76, stretch); pose.bodyZ = mix(-.04, -.26, stretch); pose.bodySY = mix(1, .8, stretch); pose.bodyRX = .32 * stretch; pose.headY = mix(1.86, 1.07, stretch); pose.headZ = mix(.12, .65, stretch); pose.headRX = .25 * stretch; pose.headRZ = -.04 * stretch;
      pose.legY = mix(.53, .26, stretch); pose.legZ = mix(.31, .58, stretch); pose.legSY = mix(1, .75, stretch); pose.legRX = 1.05 * stretch; pose.pawZ = mix(.40, .92, stretch); pose.hindY = mix(.41, .51, stretch); pose.hindZ = mix(-.03, -.20, stretch); pose.eyes = .76; pose.tailSpeed = 4; pose.tailRange = .18;
    } else if (action === 'celebrate') {
      setPhase(e < .4 ? 'anticipate' : e < 2.6 ? 'celebrating' : 'satisfied'); pose.rootY = e < 1.9 ? Math.abs(Math.sin(e * Math.PI * 1.8)) * .22 * Math.max(0, 1 - e / 2) * motion : 0; pose.rootRZ = Math.sin(e * 8) * .027 * motion; pose.headRX = -.06; pose.jawOpen = .19; pose.tongueOut = .7; pose.tailSpeed = 13; pose.tailRange = .36; confetti.visible = !reduced;
      confettiPieces.forEach((piece, i) => { const p = Math.max(0, e - (i % 6) * .035), angle = i * 2.39996, radius = .27 + p * (.31 + (i % 4) * .06); piece.position.set(Math.cos(angle) * radius, 2.6 + p * (1 + (i % 3) * .2) - p * p * 1.1, Math.sin(angle) * radius); piece.rotation.set(p * 3 + i, p * 2, p * 4 + i); piece.visible = piece.position.y > .1; });
    } else {
      setPhase(action === 'sit' ? 'sitting' : 'idle'); if (!reduced) { const look = Math.sin(clock * .43) * .055 + Math.sin(clock * .19) * .07, sniff = clock % 11 > 9.7 ? Math.sin(clock * 12) * .013 : 0; pose.headRY = look; pose.headRX = sniff; pose.headRZ = Math.sin(clock * .62) * .026; pose.earTilt += Math.sin(clock * 1.7) * .012; }
    }
    if (lastKibbleCount !== foodCount) { kibble.count = foodCount; lastKibbleCount = foodCount; } return pose;
  }
  function step(delta, immediate = false) {
    if (!staticAction) actionElapsed = Math.max(0, clock - actionStart);
    if (action !== 'idle' && action !== 'sleep' && !staticAction && actionElapsed > (durations[action] || 0)) { if (action === 'feed') announce('terminó de comer y vuelve a sentarse, satisfecho.'); action = 'idle'; actionStart = clock; actionElapsed = 0; }
    const target = desiredPose(), alpha = immediate ? 1 : 1 - Math.exp(-delta * 10); for (const key of Object.keys(basePose)) currentPose[key] = mix(currentPose[key], target[key], alpha);
    const p = currentPose, breath = reduced ? 0 : Math.sin(clock * (action === 'sleep' ? 1.3 : 2.1)) * (action === 'sleep' ? .011 : .009);
    bodyRig.position.set(0, p.bodyY + breath, p.bodyZ); bodyRig.scale.y = p.bodySY; bodyRig.rotation.x = p.bodyRX; head.position.set(p.headX, p.headY + breath, p.headZ); head.rotation.set(p.headRX, p.headRY, p.headRZ); puppy.position.y = p.rootY; puppy.rotation.z = p.rootRZ;
    hindLegs.forEach(hind => { hind.position.y = p.hindY; hind.position.z = p.hindZ; }); frontLegs.forEach((leg, i) => { const lift = i ? p.rightLift : p.leftLift; leg.position.y = p.legY + lift * .65; leg.position.z = p.legZ; leg.scale.y = p.legSY; leg.rotation.x = p.legRX - lift * 1.2; }); paws.forEach((paw, i) => { const lift = i ? p.rightLift : p.leftLift; paw.position.y = p.pawY + lift; paw.position.z = p.pawZ - lift * .28; paw.rotation.x = -lift * 1.5; }); ears.forEach((ear, i) => { ear.rotation.z = (i === 0 ? -1 : 1) * p.earTilt; });
    const blinkCycle = clock % 5.3, blink = !reduced && blinkCycle > 5.07 ? Math.max(.045, Math.abs(blinkCycle - 5.185) / .115) : 1, eyeOpen = Math.max(.025, p.eyes * blink); eyeGroups.forEach(eye => { eye.scale.y = eyeOpen; }); lids.forEach(lid => { lid.position.y = .216 - (1 - eyeOpen) * .105; lid.scale.y = .024 + (1 - eyeOpen) * .103; });
    jaw.rotation.x = p.jawOpen; tongue.position.set(p.tongueSide, -.026 - p.tongueOut * .038, .142 + p.tongueOut * .08); tongueMesh.scale.y = .035 + p.tongueOut * .1; tongue.visible = p.tongueOut > .025; tail.rotation.z = reduced ? .08 : Math.sin(clock * p.tailSpeed) * p.tailRange; tail.rotation.y = reduced ? 0 : Math.sin(clock * p.tailSpeed * .8) * p.tailRange * .5; turntable.rotation.y = reduced ? orbit : mix(turntable.rotation.y, orbit, Math.min(1, delta * 10));
  }
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  function animate(time) { frame = 0; if (disposed || !visible || reduced) return; if (!lastTime) lastTime = time - 1000 / 30; const elapsed = time - lastTime; if (elapsed >= 1000 / 30 - .3) { const delta = Math.min(elapsed / 1000, .12); lastTime = time; clock += delta; step(delta); render(); } frame = requestAnimationFrame(animate); }
  function startLoop() { if (!disposed && !reduced && visible && !frame) { lastTime = 0; frame = requestAnimationFrame(animate); } }
  function stopLoop() { if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function resize() { if (disposed) return; const rect = root.getBoundingClientRect(), w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height)); if (width !== w || height !== h) { width = w; height = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.set(3.15, 2.64, camera.aspect < .70 ? 8 : 6.2); camera.lookAt(0, 1.1, 0); camera.updateProjectionMatrix(); render(); } }
  function update(nextPet = {}) { if (lostFallback) return lostFallback.update(nextPet); if (disposed) return; const next = normalizePet({ ...pet, ...nextPet }), fedMore = next.fed > pet.fed, renamed = next.name !== pet.name; pet = next; Object.entries(outfits).forEach(([name, object]) => { object.visible = name === pet.outfit; }); chestPatch.visible = pet.outfit !== 'sweater'; canvas.setAttribute('aria-label', `${pet.name}, un perrito de estudio en 3D con cama, pelota y bol. Arrastra o usa las flechas para girar. Pulsa Enter para acariciarlo.`); if (renamed || !nameTexture) nameTag(); if (fedMore) feed(); render(); }
  const onPointerDown = event => { if (event.button !== undefined && event.button !== 0) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, orbit, moved: false }; canvas.setPointerCapture?.(event.pointerId); canvas.style.cursor = 'grabbing'; };
  const onPointerMove = event => { if (!pointer || event.pointerId !== pointer.id) return; const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; if (Math.abs(dx) + Math.abs(dy) > 8) pointer.moved = true; orbit = pointer.orbit + dx * .010; if (reduced) { turntable.rotation.y = orbit; render(); } };
  const onPointerUp = event => { if (!pointer || event.pointerId !== pointer.id) return; const caress = !pointer.moved && event.type !== 'pointercancel'; if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId); pointer = null; canvas.style.cursor = 'grab'; if (caress && action !== 'feed') play('pet'); };
  const onKeyDown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (action !== 'feed') play('pet'); return; } if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return; event.preventDefault(); orbit = event.key === 'Home' ? -.24 : orbit + (event.key === 'ArrowLeft' ? -.35 : .35); if (reduced) { turntable.rotation.y = orbit; render(); } };
  function onMotionChange(event) { reduced = event.matches; if (reduced) { stopLoop(); staticAction = true; if (action !== 'sleep') actionElapsed = durations[action] || 0; step(0, true); render(); } else { staticAction = false; action = 'idle'; actionStart = clock; actionElapsed = 0; startLoop(); } }
  const onVisibility = () => { visible = inViewport && !document.hidden; if (visible) startLoop(); else stopLoop(); };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize); observer?.observe(root); if (!observer) globalThis.addEventListener('resize', resize);
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => { inViewport = entries[0].isIntersecting; visible = inViewport && !document.hidden; if (visible) startLoop(); else stopLoop(); }, { rootMargin: '50px' }); intersection?.observe(root);
  const onContextLost = event => { event.preventDefault(); dispose(); const fallbackRoot = document.createElement('div'); Object.assign(fallbackRoot.style, { width: '100%', height: '100%', minHeight: compact ? '180px' : '300px' }); container.append(fallbackRoot); lostFallback = mountFallback(fallbackRoot, pet); };
  canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointercancel', onPointerUp); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); document.addEventListener('visibilitychange', onVisibility); reducedQuery?.addEventListener?.('change', onMotionChange);
  function dispose() { if (lostFallback) { lostFallback.dispose(); lostFallback = null; } if (disposed) return; disposed = true; stopLoop(); observer?.disconnect(); intersection?.disconnect(); if (!observer) globalThis.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility); reducedQuery?.removeEventListener?.('change', onMotionChange); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointercancel', onPointerUp); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); scene.traverse(object => { if (object.isInstancedMesh) object.dispose(); }); geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose()); renderer.dispose(); renderer.forceContextLoss(); root.remove(); }
  update(pet); step(0, true); resize(); startLoop();
  return { dispose, celebrate, feed, update, play, getAnimationState, supported: true };
}
function normalizePet(pet) { return { name: String(pet.name || 'Toby').slice(0, 30), outfit: ['none', 'scarf', 'cap', 'sweater', 'crown'].includes(pet.outfit) ? pet.outfit : 'none', fed: Math.max(0, Number(pet.fed) || 0) }; }
function emptyController() { return { dispose() {}, celebrate() { return false; }, feed() { return false; }, update() {}, play() { return false; }, getAnimationState() { return { action: 'idle', phase: 'idle', elapsed: 0, busy: false }; }, supported: false }; }
function mountFallback(root, initialPet, status) {
  let pet = normalizePet(initialPet), state = { action: 'idle', phase: 'idle', elapsed: 0, busy: false };
  const image = document.createElement('img'); image.src = new URL('./dog-fallback.svg', import.meta.url).href; image.alt = `${pet.name}, tu perrito de estudio con su cama y juguetes`; Object.assign(image.style, { display: 'block', width: '100%', height: '100%', minHeight: '180px', maxHeight: '440px', objectFit: 'contain' }); root.append(image);
  const feedback = status || document.createElement('span'); if (!status) { feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); Object.assign(feedback.style, { display: 'block', textAlign: 'center', color: '#537664', fontSize: '.8rem' }); root.append(feedback); }
  const labels = { feed: 'ha comido y está satisfecho.', pet: 'disfruta tus caricias.', play: 'juega con su pelota.', sleep: 'descansa en su cama.', stretch: 'estira sus patas.', sit: 'está sentado contigo.', celebrate: 'celebra tu avance.' };
  function action(value) { state = { action: value, phase: value === 'sleep' ? 'sleeping' : 'satisfied', elapsed: 0, busy: false }; root.dataset.action = value; root.dataset.phase = state.phase; feedback.textContent = `${pet.name} ${labels[value]}`; return true; }
  return { supported: false, dispose() { root.remove(); }, celebrate() { return action('celebrate'); }, feed() { return action('feed'); }, play(value) { return ['pet', 'play', 'sleep', 'stretch', 'sit'].includes(value) ? action(value) : false; }, getAnimationState() { return { ...state }; }, update(nextPet) { const next = normalizePet({ ...pet, ...nextPet }), fedMore = next.fed > pet.fed; pet = next; image.alt = `${pet.name}, tu perrito de estudio con su cama y juguetes`; if (fedMore) action('feed'); } };
}
