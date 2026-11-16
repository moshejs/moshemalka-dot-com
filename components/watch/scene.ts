import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from "three";

/**
 * The watch: an authentic Rolex Milgauss Ref. 116400GV "Z-Blue" three-hander
 * with a 40mm Oystersteel monobloc case, smooth mirror-polished bezel,
 * electric Z-Blue sunray dial, green sapphire Glace Verte (GV) crystal,
 * applied Chromalight baton indices, applied Rolex coronet at twelve,
 * iconic orange lightning-bolt sweep seconds hand with arrowhead,
 * and three-link Oyster bracelet with polished center links.
 *
 * Units: dial radius is 1. Face lies in XY plane looking down +Z; 12 o'clock is +Y.
 */

const S = 1 / 184; // SVG dial units → scene units
const RAD = Math.PI / 180;

export type Watch = {
  group: Group;
  /** Clockwise degrees from twelve; unwrapped values are fine. */
  setHands(hourDeg: number, minuteDeg: number, secondDeg: number): void;
  /** pull 0..1 = crown pushed in..pulled out to set; spin in degrees. */
  setCrown(pull: number, spinDeg: number): void;
  dispose(): void;
};

function lathe(profile: [number, number][], material: Material, segments = 128): Mesh {
  const geo = new LatheGeometry(
    profile.map(([r, z]) => new Vector2(r, z)),
    segments
  );
  geo.rotateX(Math.PI / 2); // lathe height (y) becomes depth toward the viewer (z)
  return new Mesh(geo, material);
}

function roundedRect(w: number, h: number, r: number): Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** The dial print: Z-Blue sunray, minute track, 12 radial orange 5-min numerals, and Milgauss typography. */
function drawDial(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const R = size / 2;
  g.translate(R, R);

  // Z-blue sunburst: electric metallic blue gradient with subtle deep navy perimeter
  const base = g.createRadialGradient(0, 0, 0, 0, 0, R);
  base.addColorStop(0, "#2b79de");
  base.addColorStop(0.35, "#2062b8");
  base.addColorStop(0.72, "#13468e");
  base.addColorStop(1, "#092558");
  g.fillStyle = base;
  g.fillRect(-R, -R, size, size);

  // Micro-fine radial brushing (1440 streaks for continuous metallic sunray sheen)
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1440; i++) {
    const a = (i / 1440) * Math.PI * 2;
    const w = 0.0022 + rnd() * 0.004;
    const bright = rnd() > 0.48;
    g.fillStyle = bright
      ? `rgba(255,255,255,${0.015 + rnd() * 0.045})`
      : `rgba(0,10,36,${0.02 + rnd() * 0.06})`;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, a - w, a + w);
    g.closePath();
    g.fill();
  }

  // Four-lobed conic sheen typical of radial brushed luxury watch dials
  if (typeof g.createConicGradient === "function") {
    const sheen = g.createConicGradient(-Math.PI * 0.62, 0, 0);
    const lobes = 4;
    for (let i = 0; i <= lobes * 2; i++) {
      sheen.addColorStop(i / (lobes * 2), i % 2 ? "rgba(0,8,28,0.32)" : "rgba(255,255,255,0.13)");
    }
    g.fillStyle = sheen;
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.fill();
  }

  const u = R / 184; // draw in SVG dial units

  // Outer minute track circle
  g.strokeStyle = "rgba(240,246,255,0.85)";
  g.lineWidth = 0.9 * u;
  g.beginPath();
  g.arc(0, 0, 172 * u, 0, Math.PI * 2);
  g.stroke();

  // Minute ticks
  g.lineCap = "butt";
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i * 6 - 90) * RAD;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const r1 = (major ? 163.5 : 167) * u;
    const r2 = 172 * u;
    g.strokeStyle = major ? "rgba(255,255,255,0.95)" : "rgba(225,236,248,0.72)";
    g.lineWidth = (major ? 2.5 : 1.1) * u;
    g.beginPath();
    g.moveTo(r1 * cosA, r1 * sinA);
    g.lineTo(r2 * cosA, r2 * sinA);
    g.stroke();
  }

  // The 12 Orange 5-minute numerals: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60
  // Each numeral is rotated radially with its baseline toward center
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const num = i === 12 ? "60" : String(i * 5);
    const deg = i * 30;
    g.save();
    g.rotate(deg * RAD);
    g.translate(0, -153 * u);
    g.fillStyle = "#ff6a00"; // signature Milgauss orange
    g.font = `700 ${11 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    g.fillText(num, 0, 0);
    g.restore();
  }

  // Dial typography
  const spaced = (px: number) => {
    (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px * u}px`;
  };

  g.save();
  g.textAlign = "center";
  g.textBaseline = "middle";

  // ROLEX
  g.fillStyle = "#ffffff";
  g.font = `700 ${17 * u}px "Times New Roman", Times, Georgia, serif`;
  spaced(2.4);
  g.fillText("ROLEX", 0, -90 * u);

  // OYSTER PERPETUAL
  g.font = `600 ${7.5 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  spaced(1.8);
  g.fillText("OYSTER PERPETUAL", 0, -75 * u);

  // MILGAUSS (in bold orange)
  g.fillStyle = "#ff6a00";
  g.font = `800 ${11.5 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  spaced(3.2);
  g.fillText("MILGAUSS", 0, -58 * u);

  // 6 o'clock text: SUPERLATIVE CHRONOMETER / OFFICIALLY CERTIFIED
  g.fillStyle = "rgba(240, 246, 255, 0.92)";
  g.font = `500 ${6.4 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  spaced(1.1);
  g.fillText("SUPERLATIVE CHRONOMETER", 0, 52 * u);
  g.fillText("OFFICIALLY CERTIFIED", 0, 63 * u);

  // Flanking 6 o'clock at bottom perimeter: SWISS and MADE
  g.fillStyle = "rgba(225, 235, 248, 0.72)";
  g.font = `600 ${5.2 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  spaced(0.6);

  // SWISS (at ~28.5 min, angle -8.5 deg from 6 o'clock)
  const swissX = 175 * u * Math.sin(-8.5 * RAD);
  const swissY = 175 * u * Math.cos(-8.5 * RAD);
  g.save();
  g.translate(swissX, swissY);
  g.rotate(8.5 * RAD);
  g.fillText("SWISS", 0, 0);
  g.restore();

  // MADE (at ~31.5 min, angle +8.5 deg from 6 o'clock)
  const madeX = 175 * u * Math.sin(8.5 * RAD);
  const madeY = 175 * u * Math.cos(8.5 * RAD);
  g.save();
  g.translate(madeX, madeY);
  g.rotate(-8.5 * RAD);
  g.fillText("MADE", 0, 0);
  g.restore();

  g.restore();

  return c;
}

/** The 5-point Rolex Coronet applied at 12 o'clock */
function createCoronetShape(): Shape {
  const shape = new Shape();
  const s = S;
  // Sits below "60" at radius 112 to 138
  shape.moveTo(-5.5 * s, 112 * s);
  shape.quadraticCurveTo(0, 113.5 * s, 5.5 * s, 112 * s);
  shape.lineTo(11.5 * s, 126 * s);   // right outer tip
  shape.lineTo(6.8 * s, 119 * s);    // right outer notch
  shape.lineTo(6.5 * s, 133 * s);    // right mid tip
  shape.lineTo(2.8 * s, 120 * s);    // right inner notch
  shape.lineTo(0, 138 * s);          // center tall tip
  shape.lineTo(-2.8 * s, 120 * s);   // left inner notch
  shape.lineTo(-6.5 * s, 133 * s);   // left mid tip
  shape.lineTo(-6.8 * s, 119 * s);   // left outer notch
  shape.lineTo(-11.5 * s, 126 * s);  // left outer tip
  shape.closePath();
  return shape;
}

/** The authentic Rolex Milgauss lightning-bolt sweep seconds hand with arrowhead */
function createLightningHand(): Shape {
  const shape = new Shape();
  const tailW = 0.016;
  const neckW = 0.010;

  // Tail counterweight
  shape.moveTo(-tailW, -0.27);
  shape.lineTo(tailW, -0.27);
  shape.lineTo(tailW, -0.19);
  shape.lineTo(neckW, -0.19);
  shape.lineTo(neckW, 0.22); // straight neck from hub

  // Kink 1: turns sharply right
  shape.lineTo(0.096, 0.38);
  shape.lineTo(0.076, 0.395);

  // Kink 2: cuts sharply across the centerline to the left
  shape.lineTo(-0.088, 0.545);
  shape.lineTo(-0.108, 0.53);

  // Kink 3: cuts sharply back toward the right
  shape.lineTo(0.038, 0.705);
  shape.lineTo(0.018, 0.718);

  // Straightens toward the arrowhead
  shape.lineTo(neckW, 0.815);

  // Arrowhead right barb wing
  shape.lineTo(0.032, 0.815);
  shape.lineTo(0.034, 0.835);

  // Arrowhead sharp tip pointing directly at 60s
  shape.lineTo(0.0, 0.945);

  // Arrowhead left barb wing
  shape.lineTo(-0.034, 0.835);
  shape.lineTo(-0.032, 0.815);

  // Straightens back down left side
  shape.lineTo(-neckW, 0.815);

  // Kink 3 inner left
  shape.lineTo(-0.004, 0.718);
  shape.lineTo(0.016, 0.705);

  // Kink 2 inner left
  shape.lineTo(-0.088, 0.53);
  shape.lineTo(-0.068, 0.545);

  // Kink 1 inner left
  shape.lineTo(0.076, 0.395);
  shape.lineTo(0.054, 0.38);

  // Neck down to hub & tail
  shape.lineTo(-neckW, 0.22);
  shape.lineTo(-neckW, -0.19);
  shape.lineTo(-tailW, -0.19);
  shape.closePath();

  return shape;
}

export function buildWatch(maxAnisotropy = 8): Watch {
  const group = new Group();
  const geos: BufferGeometry[] = [];
  const mats: Material[] = [];
  const mat = <T extends Material>(m: T): T => (mats.push(m), m);
  const add = (parent: Group, geo: BufferGeometry, material: Material, cast = true, receive = true) => {
    geos.push(geo);
    const mesh = new Mesh(geo, material);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  };

  /* ── Materials: Rolex 904L Oystersteel, Chromalight, Glace Verte & Milgauss Orange ── */
  const brushed = mat(
    new MeshStandardMaterial({ color: 0xb4c0cf, metalness: 0.96, roughness: 0.32, side: DoubleSide })
  );
  const polished = mat(
    new MeshStandardMaterial({ color: 0xe6edf5, metalness: 0.98, roughness: 0.05, side: DoubleSide })
  );
  const handSteel = mat(
    new MeshStandardMaterial({ color: 0xf6f9fc, metalness: 1.0, roughness: 0.08 })
  );
  const lume = mat(
    new MeshStandardMaterial({
      color: 0xf8fcf9,
      roughness: 0.45,
      metalness: 0,
      emissive: 0x98e8cd,
      emissiveIntensity: 0.32,
    })
  );
  const orange = mat(
    new MeshStandardMaterial({
      color: 0xff6a00,
      roughness: 0.32,
      metalness: 0.1,
      emissive: 0xff4800,
      emissiveIntensity: 0.26,
    })
  );

  const dialTexture = new CanvasTexture(drawDial(1536));
  dialTexture.colorSpace = SRGBColorSpace;
  dialTexture.anisotropy = maxAnisotropy;
  const dialMat = mat(
    new MeshStandardMaterial({ map: dialTexture, metalness: 0.4, roughness: 0.45, envMapIntensity: 0.65 })
  );

  /* ── 40mm Oyster Case & Smooth Bezel ── */
  // The Milgauss 116400 has a famously thick 13.1mm profile with tall slab-sided
  // mirror-polished case flanks and a bold domed bezel to house its magnetic shield.
  const caseMesh = lathe(
    [
      [0, -0.44],         // domed caseback center
      [0.45, -0.43],      // caseback inner dome
      [0.85, -0.40],      // caseback outer dome
      [1.08, -0.36],      // caseback seat
      [1.21, -0.32],      // under-case bevel
      [1.285, -0.26],     // lower flank curve
      [1.305, -0.18],     // vertical slab flank bottom
      [1.31, -0.06],      // vertical slab flank middle
      [1.305, 0.02],      // vertical slab flank top
      [1.29, 0.07],       // upper flank curve
      [1.265, 0.10],      // flank meeting bezel base
      [0.985, 0.08],      // upper rehaut seat
      [0.985, -0.02],     // dial seating ledge
      [0, -0.02],
    ],
    polished
  );
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  geos.push(caseMesh.geometry);
  group.add(caseMesh);

  // Smooth domed mirror-polished bezel with inner sloping steel rehaut
  const bezel = lathe(
    [
      [0.965, 0.0],       // inner rehaut meeting dial edge
      [0.985, 0.165],     // rehaut top & crystal seat
      [1.005, 0.185],     // crystal rim contact
      [1.055, 0.22],      // bezel inner dome
      [1.135, 0.235],     // bezel apex
      [1.205, 0.205],     // bezel outer slope
      [1.245, 0.155],     // bezel outer curve
      [1.265, 0.10],      // bezel base meeting case
    ],
    polished
  );
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  geos.push(bezel.geometry);
  group.add(bezel);

  /* ── Dial ── */
  const dial = add(group, new CircleGeometry(0.985, 128), dialMat, false, true);
  dial.position.z = 0.001;

  /* ── Applied Rolex Coronet at 12 o'clock ── */
  const coronetShape = createCoronetShape();
  const coronet = add(
    group,
    new ExtrudeGeometry(coronetShape, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }),
    handSteel
  );
  coronet.position.z = 0.002;

  // Jewel-like round balls at the 5 coronet tips
  const s = S;
  const tipCoords: [number, number][] = [
    [-11.5 * s, 126 * s],
    [-6.5 * s, 133 * s],
    [0, 138 * s],
    [6.5 * s, 133 * s],
    [11.5 * s, 126 * s],
  ];
  tipCoords.forEach(([tx, ty]) => {
    const ball = add(group, new SphereGeometry(1.6 * s, 16, 16), handSteel);
    ball.position.set(tx, ty, 0.016);
  });

  /* ── Applied Chromalight Hour Batons (Hours 1 to 11) ── */
  for (let i = 1; i < 12; i++) {
    const marker = new Group();
    marker.rotation.z = -i * 30 * RAD;
    const quarter = i === 3 || i === 6 || i === 9;
    const frameW = (quarter ? 11.2 : 9.2) * S;
    const frameL = (quarter ? 30 : 25) * S;
    const midY = (quarter ? 116 : 118) * S;

    // Polished white gold frame with subtle bevel
    const frameShape = roundedRect(frameW, frameL, 1.2 * S);
    const frame = add(
      marker,
      new ExtrudeGeometry(frameShape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 2 }),
      handSteel
    );
    frame.position.set(0, midY, 0.002);

    // Clean white Chromalight lume inlay
    const lumeShape = roundedRect(frameW - 3.2 * S, frameL - 3.2 * S, 0.8 * S);
    const fill = add(
      marker,
      new ExtrudeGeometry(lumeShape, { depth: 0.006, bevelEnabled: false }),
      lume,
      false
    );
    fill.position.set(0, midY, 0.019);

    group.add(marker);
  }

  /* ── Hands: Faceted White Gold Batons + Lightning Seconds ── */
  const flat = { bevelEnabled: false } as const;

  // Hour Hand (faceted baton with pointed tip)
  const hour = new Group();
  const hourShape = new Shape();
  hourShape.moveTo(-0.031, -0.05);
  hourShape.lineTo(0.031, -0.05);
  hourShape.lineTo(0.027, 0.50);
  hourShape.lineTo(0, 0.58);
  hourShape.lineTo(-0.027, 0.50);
  hourShape.closePath();
  add(hour, new ExtrudeGeometry(hourShape, { depth: 0.013, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2 }), handSteel);

  const hourLume = new Shape();
  hourLume.moveTo(-0.014, 0.10);
  hourLume.lineTo(0.014, 0.10);
  hourLume.lineTo(0.014, 0.47);
  hourLume.lineTo(0, 0.52);
  hourLume.lineTo(-0.014, 0.47);
  hourLume.closePath();
  add(hour, new ExtrudeGeometry(hourLume, { depth: 0.005, ...flat }), lume, false).position.z = 0.014;
  hour.position.z = 0.045;
  group.add(hour);

  // Minute Hand (longer faceted baton reaching minute track)
  const minute = new Group();
  const minShape = new Shape();
  minShape.moveTo(-0.025, -0.05);
  minShape.lineTo(0.025, -0.05);
  minShape.lineTo(0.021, 0.80);
  minShape.lineTo(0, 0.88);
  minShape.lineTo(-0.021, 0.80);
  minShape.closePath();
  add(minute, new ExtrudeGeometry(minShape, { depth: 0.013, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2 }), handSteel);

  const minLume = new Shape();
  minLume.moveTo(-0.011, 0.10);
  minLume.lineTo(0.011, 0.10);
  minLume.lineTo(0.011, 0.77);
  minLume.lineTo(0, 0.82);
  minLume.lineTo(-0.011, 0.77);
  minLume.closePath();
  add(minute, new ExtrudeGeometry(minLume, { depth: 0.005, ...flat }), lume, false).position.z = 0.014;
  minute.position.z = 0.068;
  group.add(minute);

  // The Lightning Seconds Hand with Arrowhead
  const seconds = new Group();
  const boltShape = createLightningHand();
  add(seconds, new ExtrudeGeometry(boltShape, { depth: 0.008, ...flat }), orange);

  // Center hub in orange with polished white gold central pin and domed cap
  const hub = add(seconds, new CylinderGeometry(0.038, 0.038, 0.012, 40), orange);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.006;
  seconds.position.z = 0.092;
  group.add(seconds);

  const pin = add(group, new CylinderGeometry(0.016, 0.016, 0.026, 24), polished);
  pin.rotation.x = Math.PI / 2;
  pin.position.z = 0.106;

  const pinCap = add(group, new SphereGeometry(0.016, 16, 16), polished);
  pinCap.position.z = 0.116;

  /* ── Crystal: Green Sapphire Glace Verte (GV) ── */
  // Crystal clear face-on sapphire lens
  const crystalMat = mat(
    new MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.01,
      metalness: 0,
      transmission: 0.98,
      thickness: 0.045,
      ior: 1.77,
      attenuationColor: 0x48e698,
      attenuationDistance: 2.2,
      envMapIntensity: 2.8,
    })
  );
  const crystal = add(group, new CylinderGeometry(1.005, 1.005, 0.04, 128), crystalMat, false, false);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = 0.185;

  // Iconic Glace Verte luminous emerald green beveled rim
  const gvRimMat = mat(
    new MeshStandardMaterial({
      color: 0x16df84,
      emissive: 0x0fc46e,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.05,
    })
  );
  const rim = add(group, new TorusGeometry(0.995, 0.016, 16, 160), gvRimMat, false, false);
  rim.position.z = 0.192;

  /* ── Rolex Twinlock Crown at 3 o'clock ── */
  // Seated snugly against the thick 13.1mm case flank with no exposed stem
  const crown = new Group();
  const crownMat = mat(new MeshStandardMaterial({ color: 0xe6edf5, metalness: 0.98, roughness: 0.12 }));
  const knob = add(crown, new CylinderGeometry(0.185, 0.185, 0.14, 24, 1), crownMat);
  knob.rotation.z = Math.PI / 2;
  knob.position.x = 0.06;

  const cap = add(crown, new CylinderGeometry(0.16, 0.185, 0.03, 24), polished);
  cap.rotation.z = -Math.PI / 2;
  cap.position.x = 0.145;

  const CROWN_X = 1.25;
  crown.position.set(CROWN_X, 0, -0.09);
  group.add(crown);

  /* ── Contoured Oyster Lugs (4 corner horns) & Solid End Links (SEL) ── */
  // The lugs leave the thick 40mm case at ~2, 4, 8, 10 o'clock with substantial depth
  const lugOutline: [number, number][] = [
    [0.585, 0.98],
    [0.585, 1.48],
    [0.62, 1.50],
    [0.76, 1.50],
    [0.82, 1.46],
    [0.94, 1.24],
    [1.08, 0.94],
    [1.20, 0.62],
    [1.28, 0.28],
    [1.05, 0.28],
    [0.88, 0.68],
  ];

  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      const pts = lugOutline.map(([x, y]) => [x * sx, y * sy] as [number, number]);
      if (sx * sy < 0) pts.reverse();
      const s = new Shape();
      pts.forEach(([x, y], idx) => {
        if (idx === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      });
      s.closePath();
      const lugGeo = new ExtrudeGeometry(s, {
        depth: 0.30,
        bevelEnabled: true,
        bevelThickness: 0.032,
        bevelSize: 0.026,
        bevelSegments: 3,
      });
      geos.push(lugGeo);
      const lugMesh = new Mesh(lugGeo, polished);
      lugMesh.castShadow = true;
      lugMesh.receiveShadow = true;
      lugMesh.position.set(0, 0, -0.24);
      lugMesh.rotation.x = -sy * 0.07; // slopes gracefully toward wrist
      group.add(lugMesh);
    }
  }

  /* ── Oyster Bracelet: Three links across, polished centre, brushed outers ── */
  const LINK = 0.32;
  const THICK = 0.12;
  const linkGeo = (width: number) => {
    const geo = new ExtrudeGeometry(roundedRect(THICK, LINK + 0.024, 0.04), {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 6,
    });
    geo.center();
    geo.rotateY(Math.PI / 2); // runs across wrist
    geos.push(geo);
    return geo;
  };
  const centreGeo = linkGeo(0.46);
  const outerGeo = linkGeo(0.37);

  const chain = (sy: number, startY: number, count: number, place: (y: number, z: number, a: number) => void) => {
    let y = startY;
    let z = -0.15;
    let a = 0;
    for (let i = 0; i < count; i++) {
      place(sy * (y + (LINK / 2) * Math.cos(a)), z - (LINK / 2) * Math.sin(a), -sy * a);
      y += LINK * Math.cos(a);
      z -= LINK * Math.sin(a);
      a += i === 0 ? 0.08 : 0.15;
    }
  };

  for (const sy of [1, -1]) {
    // Center links: mirror-polished
    chain(sy, 1.12, 9, (y, z, a) => {
      const m = new Mesh(centreGeo, polished);
      m.position.set(0, y, z);
      m.rotation.x = a;
      m.castShadow = m.receiveShadow = true;
      group.add(m);
    });
    // Outer links: satin-brushed
    chain(sy, 1.12 + LINK / 2, 9, (y, z, a) => {
      for (const x of [-0.415, 0.415]) {
        const m = new Mesh(outerGeo, brushed);
        m.position.set(x, y, z);
        m.rotation.x = a;
        m.castShadow = m.receiveShadow = true;
        group.add(m);
      }
    });

    // Solid End Link (SEL) sitting flush between the lugs hugging the case
    // Center polished segment
    const selCenter = add(group, new BoxGeometry(0.46, 0.36, THICK * 0.98), polished);
    selCenter.position.set(0, sy * 1.18, -0.15);
    // Outer brushed segments
    for (const x of [-0.415, 0.415]) {
      const selOuter = add(group, new BoxGeometry(0.37, 0.34, THICK * 0.95), brushed);
      selOuter.position.set(x, sy * 1.17, -0.15);
    }
  }

  return {
    group,
    setHands(h, m, s) {
      hour.rotation.z = -h * RAD;
      minute.rotation.z = -m * RAD;
      seconds.rotation.z = -s * RAD;
    },
    setCrown(pull, spinDeg) {
      crown.position.x = CROWN_X + pull * 0.06;
      crown.rotation.x = spinDeg * RAD;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      dialTexture.dispose();
    },
  };
}
