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
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from "three";

/**
 * The watch, built from primitives: an antimagnetic-style steel three-hander
 * with a smooth bezel, a Z-blue sunray dial, a green sapphire crystal, an
 * orange lightning seconds hand and a three-link bracelet. Deliberately
 * unbranded: no crown logo, no maker's name; the dial says MALKA.
 *
 * Units: the dial radius is 1. The face lies in the XY plane and looks down
 * +Z; twelve o'clock is +Y.
 */

const S = 1 / 184; // the SVG dial's units → scene units
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

/** A polygon given in the SVG dial's coordinates (y down), as a scene shape. */
function svgShape(points: [number, number][], scale = S): Shape {
  const shape = new Shape();
  points.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x * scale, -y * scale);
    else shape.lineTo(x * scale, -y * scale);
  });
  shape.closePath();
  return shape;
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

/** The dial print: sunray blue, minute track, numerals and text. */
function drawDial(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const R = size / 2;
  g.translate(R, R);

  // Z-blue, a touch brighter at the centre
  const base = g.createRadialGradient(0, 0, 0, 0, 0, R);
  base.addColorStop(0, "#245fae");
  base.addColorStop(0.7, "#184a8f");
  base.addColorStop(1, "#0f3168");
  g.fillStyle = base;
  g.fillRect(-R, -R, size, size);

  // sunray brushing: fine radial streaks plus four broad lobes of sheen
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2;
    const w = 0.004 + rnd() * 0.006;
    g.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${0.02 + rnd() * 0.05})` : `rgba(0,10,30,${0.03 + rnd() * 0.07})`;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, a - w, a + w);
    g.closePath();
    g.fill();
  }
  if (typeof g.createConicGradient === "function") {
    const sheen = g.createConicGradient(-Math.PI * 0.62, 0, 0);
    const lobes = 4;
    for (let i = 0; i <= lobes * 2; i++) {
      sheen.addColorStop(i / (lobes * 2), i % 2 ? "rgba(0,8,26,0.3)" : "rgba(255,255,255,0.1)");
    }
    g.fillStyle = sheen;
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.fill();
  }

  const u = R / 184; // draw in the SVG dial's units
  const polar = (r: number, deg: number): [number, number] => {
    const a = (deg - 90) * RAD;
    return [r * u * Math.cos(a), r * u * Math.sin(a)];
  };

  // chapter ring + minute track
  g.strokeStyle = "rgba(238,243,249,0.28)";
  g.lineWidth = 0.8 * u;
  g.beginPath();
  g.arc(0, 0, 171 * u, 0, Math.PI * 2);
  g.stroke();
  g.lineCap = "butt";
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(major ? 161 : 166, i * 6);
    const [x2, y2] = polar(179, i * 6);
    g.strokeStyle = major ? "#ffa42e" : "#e9eef5";
    g.lineWidth = (major ? 3.2 : 1.3) * u;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  g.textAlign = "center";
  g.textBaseline = "middle";
  const spaced = (px: number) => {
    (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px * u}px`;
  };

  g.fillStyle = "#ffb04a";
  g.font = `600 ${11.5 * u}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  spaced(0);
  for (const [n, a] of [
    ["15", 90],
    ["30", 180],
    ["45", 270],
    ["60", 0],
  ] as const) {
    const [x, y] = polar(147, a);
    g.fillText(n, x, y);
  }

  g.fillStyle = "#ffffff";
  g.font = `700 ${18 * u}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  spaced(3.4);
  g.fillText("MALKA", 1.7 * u, -70 * u);

  g.font = `500 ${8.5 * u}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  spaced(1.8);
  g.fillStyle = "#ffb04a";
  g.fillText("NEW YORK", 0.9 * u, 62 * u);
  g.fillStyle = "rgba(238,243,249,0.82)";
  g.fillText("SINCE 2008", 0.9 * u, 77 * u);

  return c;
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

  /* ── Materials ── */
  const brushed = mat(new MeshStandardMaterial({ color: 0x9da8b5, metalness: 1, roughness: 0.4, side: DoubleSide }));
  const polished = mat(new MeshStandardMaterial({ color: 0xd3dae2, metalness: 1, roughness: 0.07, side: DoubleSide }));
  const handSteel = mat(new MeshStandardMaterial({ color: 0xf1f4f8, metalness: 1, roughness: 0.14 }));
  const lume = mat(
    new MeshStandardMaterial({ color: 0xf3f8f4, roughness: 0.7, metalness: 0, emissive: 0xbfeedd, emissiveIntensity: 0.22 })
  );
  const orangeLume = mat(
    new MeshStandardMaterial({ color: 0xffa42e, roughness: 0.6, metalness: 0, emissive: 0xff7a00, emissiveIntensity: 0.3 })
  );
  const orange = mat(
    new MeshStandardMaterial({ color: 0xff9a1f, roughness: 0.42, metalness: 0.15, emissive: 0xff6a00, emissiveIntensity: 0.28 })
  );

  const dialTexture = new CanvasTexture(drawDial(1536));
  dialTexture.colorSpace = SRGBColorSpace;
  dialTexture.anisotropy = maxAnisotropy;
  const dialMat = mat(new MeshStandardMaterial({ map: dialTexture, metalness: 0.35, roughness: 0.5, envMapIntensity: 0.55 }));

  /* ── Case, bezel ── */
  const caseMesh = lathe(
    [
      [0, -0.235],
      [1.0, -0.235],
      [1.13, -0.2],
      [1.165, -0.15],
      [1.165, 0.03],
      [1.14, 0.075],
      [0.99, 0.075],
      [0.99, -0.02],
      [0, -0.02],
    ],
    brushed
  );
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  geos.push(caseMesh.geometry);
  group.add(caseMesh);

  // smooth domed bezel, mirror-polished, with the sloped inner flange below the glass
  const bezel = lathe(
    [
      [0.972, 0.0],
      [0.995, 0.15],
      [1.02, 0.182],
      [1.06, 0.192],
      [1.1, 0.178],
      [1.135, 0.145],
      [1.155, 0.1],
      [1.16, 0.07],
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

  // applied hour markers: a steel frame with a lume fill; orange at 3, 6, 9
  for (let i = 0; i < 12; i++) {
    const marker = new Group();
    marker.rotation.z = -i * 30 * RAD;
    if (i === 0) {
      const frame = add(
        marker,
        new ExtrudeGeometry(svgShape([[0, -131], [-12.5, -110], [12.5, -110]]), { depth: 0.02, bevelEnabled: false }),
        handSteel
      );
      frame.position.z = 0.002;
      const fill = add(
        marker,
        new ExtrudeGeometry(svgShape([[0, -126], [-8.5, -112.5], [8.5, -112.5]]), { depth: 0.006, bevelEnabled: false }),
        lume,
        false
      );
      fill.position.z = 0.022;
    } else {
      const quarter = i % 3 === 0;
      const len = (quarter ? 31 : 25) * S;
      const mid = (quarter ? 116.5 : 117.5) * S;
      const frame = add(marker, new BoxGeometry(10.5 * S, len, 0.02), handSteel);
      frame.position.set(0, mid, 0.012);
      const fill = add(marker, new BoxGeometry(7 * S, len - 3.5 * S, 0.006), quarter ? orangeLume : lume, false);
      fill.position.set(0, mid, 0.025);
    }
    group.add(marker);
  }

  /* ── Hands ── */
  const flat = { bevelEnabled: false } as const;
  const hour = new Group();
  add(hour, new ExtrudeGeometry(svgShape([[-7, 15], [-7, -76], [0, -94], [7, -76], [7, 15]]), { depth: 0.012, ...flat }), handSteel);
  add(hour, new ExtrudeGeometry(svgShape([[-3.6, -20], [-3.6, -74], [0, -83], [3.6, -74], [3.6, -20]]), { depth: 0.004, ...flat }), lume, false).position.z = 0.012;
  hour.position.z = 0.045;
  group.add(hour);

  const minute = new Group();
  add(minute, new ExtrudeGeometry(svgShape([[-5, 17], [-5, -138], [0, -157], [5, -138], [5, 17]]), { depth: 0.012, ...flat }), handSteel);
  add(minute, new ExtrudeGeometry(svgShape([[-2.6, -28], [-2.6, -136], [0, -146], [2.6, -136], [2.6, -28]]), { depth: 0.004, ...flat }), lume, false).position.z = 0.012;
  minute.position.z = 0.068;
  group.add(minute);

  // The lightning seconds hand: a plain tail, a straight shaft, then the bolt
  // (out to one side, sharply back across the axis, and out again) and a
  // straight run that tapers to a point. One mitred ribbon, so the corners
  // are crisp instead of a pile of overlapping bars.
  const seconds = new Group();
  const boltPath: [number, number][] = [
    [0, -0.27],
    [0, 0.5],
    [0.07, 0.6],
    [-0.062, 0.655],
    [0.008, 0.755],
    [0, 0.955],
  ];
  const HALF = 0.015;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  boltPath.forEach(([x, y], i) => {
    const prev = boltPath[i - 1] ?? boltPath[i];
    const next = boltPath[i + 1] ?? boltPath[i];
    const unit = (dx: number, dy: number): [number, number] => {
      const l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    };
    const din = i ? unit(x - prev[0], y - prev[1]) : unit(next[0] - x, next[1] - y);
    const dout = i < boltPath.length - 1 ? unit(next[0] - x, next[1] - y) : din;
    const nin: [number, number] = [-din[1], din[0]];
    const nout: [number, number] = [-dout[1], dout[0]];
    const [mx, my] = unit(nin[0] + nout[0], nin[1] + nout[1]);
    // mitre length, capped so the sharp reversal doesn't spike
    const w = i === boltPath.length - 1 ? 0.0015 : Math.min(HALF / Math.max(0.35, mx * nin[0] + my * nin[1]), HALF * 2.4);
    left.push([x + mx * w, y + my * w]);
    right.push([x - mx * w, y - my * w]);
  });
  const ribbon = new Shape();
  [...left, ...right.reverse()].forEach(([x, y], i) => (i ? ribbon.lineTo(x, y) : ribbon.moveTo(x, y)));
  ribbon.closePath();
  add(seconds, new ExtrudeGeometry(ribbon, { depth: 0.008, ...flat }), orange);
  const hub = add(seconds, new CylinderGeometry(6.5 * S, 6.5 * S, 0.012, 40), orange);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.006;
  seconds.position.z = 0.092;
  group.add(seconds);

  const pin = add(group, new CylinderGeometry(2.8 * S, 2.8 * S, 0.03, 24), polished);
  pin.rotation.x = Math.PI / 2;
  pin.position.z = 0.105;

  /* ── Crystal: green sapphire, glowing at its edge ── */
  const crystalMat = mat(
    new MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0,
      metalness: 0,
      transmission: 1,
      thickness: 0,
      ior: 1.77,
      attenuationColor: 0x8fecc8,
      attenuationDistance: 2,
      envMapIntensity: 2.6,
    })
  );
  const crystal = add(group, new CylinderGeometry(0.998, 0.998, 0.03, 128), crystalMat, false, false);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = 0.158;

  const glow = mat(
    new MeshStandardMaterial({ color: 0x52e0a6, emissive: 0x3fe6a2, emissiveIntensity: 1.9, roughness: 0.3, metalness: 0 })
  );
  // the signature of green sapphire: nearly clear face-on, strongly green
  // toward the edge where you look through more glass
  const tintCanvas = document.createElement("canvas");
  tintCanvas.width = tintCanvas.height = 256;
  const tg = tintCanvas.getContext("2d")!;
  const tint = tg.createRadialGradient(128, 128, 0, 128, 128, 128);
  tint.addColorStop(0, "rgba(70,225,160,0.02)");
  tint.addColorStop(0.72, "rgba(70,225,160,0.05)");
  tint.addColorStop(0.9, "rgba(80,235,170,0.2)");
  tint.addColorStop(0.97, "rgba(110,250,190,0.55)");
  tint.addColorStop(1, "rgba(140,255,205,0.9)");
  tg.fillStyle = tint;
  tg.fillRect(0, 0, 256, 256);
  const tintTexture = new CanvasTexture(tintCanvas);
  tintTexture.colorSpace = SRGBColorSpace;
  const tintMat = mat(new MeshBasicMaterial({ map: tintTexture, transparent: true, depthWrite: false, toneMapped: false }));
  const tintDisc = add(group, new CircleGeometry(0.998, 96), tintMat, false, false);
  tintDisc.position.z = 0.175;
  tintDisc.renderOrder = 2;

  const rim = add(group, new TorusGeometry(0.992, 0.013, 12, 160), glow, false, false);
  rim.position.z = 0.168;

  /* ── Crown: fluted, at three o'clock ── */
  const crown = new Group();
  const stem = add(crown, new CylinderGeometry(0.06, 0.06, 0.2, 24), polished);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = 0.02;
  const knurlMat = mat(new MeshStandardMaterial({ color: 0xdfe5ec, metalness: 1, roughness: 0.2, flatShading: true }));
  const knob = add(crown, new CylinderGeometry(0.122, 0.122, 0.14, 30, 1), knurlMat);
  knob.rotation.z = Math.PI / 2;
  knob.position.x = 0.15;
  const cap = add(crown, new CylinderGeometry(0.095, 0.118, 0.026, 30), polished);
  cap.rotation.z = -Math.PI / 2;
  cap.position.x = 0.232;
  const CROWN_X = 1.12;
  crown.position.set(CROWN_X, 0, -0.07);
  group.add(crown);

  /* ── Lugs ── */
  // slim horns that leave the case tangentially and narrow toward the bracelet
  const lugOutline: [number, number][] = [
    [0.625, 0.6],
    [0.625, 1.4],
    [0.65, 1.43],
    [0.725, 1.43],
    [0.765, 1.39],
    [0.87, 1.08],
    [0.94, 0.6],
  ];
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      const pts = lugOutline.map(([x, y]) => [x * sx, y * sy] as [number, number]);
      if (sx * sy < 0) pts.reverse();
      const shape = new Shape();
      pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
      shape.closePath();
      const lug = add(
        group,
        new ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 3 }),
        brushed
      );
      lug.position.z = -0.185;
    }
  }

  /* ── Bracelet: three links across, brushed outers and a polished centre ── */
  const LINK = 0.31;
  const THICK = 0.085;
  const linkGeo = (width: number) => {
    const geo = new ExtrudeGeometry(roundedRect(THICK, LINK - 0.012, 0.034), { depth: width, bevelEnabled: false, curveSegments: 6 });
    geo.center();
    geo.rotateY(Math.PI / 2); // extrusion runs across the wrist
    geos.push(geo);
    return geo;
  };
  const centreGeo = linkGeo(0.44);
  const outerGeo = linkGeo(0.355);
  const chain = (sy: number, startY: number, count: number, place: (y: number, z: number, a: number) => void) => {
    let y = startY;
    let z = -0.125;
    let a = 0;
    for (let i = 0; i < count; i++) {
      place(sy * (y + (LINK / 2) * Math.cos(a)), z - (LINK / 2) * Math.sin(a), -sy * a);
      y += LINK * Math.cos(a);
      z -= LINK * Math.sin(a);
      a += i === 0 ? 0.1 : 0.16;
    }
  };
  for (const sy of [1, -1]) {
    chain(sy, 0.98, 9, (y, z, a) => {
      const m = new Mesh(centreGeo, polished);
      m.position.set(0, y, z);
      m.rotation.x = a;
      m.castShadow = m.receiveShadow = true;
      group.add(m);
    });
    chain(sy, 0.98 + LINK / 2, 9, (y, z, a) => {
      for (const x of [-0.404, 0.404]) {
        const m = new Mesh(outerGeo, brushed);
        m.position.set(x, y, z);
        m.rotation.x = a;
        m.castShadow = m.receiveShadow = true;
        group.add(m);
      }
    });
    // solid end piece under the lugs so no gap shows between case and bracelet
    const end = add(group, new BoxGeometry(1.2, 0.44, THICK * 0.9), brushed);
    end.position.set(0, sy * 1.06, -0.13);
  }

  return {
    group,
    setHands(h, m, s) {
      hour.rotation.z = -h * RAD;
      minute.rotation.z = -m * RAD;
      seconds.rotation.z = -s * RAD;
    },
    setCrown(pull, spinDeg) {
      crown.position.x = CROWN_X + pull * 0.085;
      crown.rotation.x = spinDeg * RAD;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      dialTexture.dispose();
      tintTexture.dispose();
    },
  };
}
