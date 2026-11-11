import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Deterministic fast 3D value noise on the unit sphere (eliminates polar pinching and UV seams)
function hash3(ix, iy, iz) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 1274126177);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function noise3(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const fz = smoothstep(z - iz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  return lerp(
    lerp(lerp(n000, n100, fx), lerp(n010, n110, fx), fy),
    lerp(lerp(n001, n101, fx), lerp(n011, n111, fx), fy),
    fz
  );
}

function fbm3(x, y, z, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += noise3(x * freq, y * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.04;
  }
  return sum / norm;
}

// Subdivide & naturally jitter coastline polygon edges so continents look ragged & organic
function subdivideCoast(points, generations = 4, jitterScale = 1.65) {
  let pts = points.map((p) => [p[0], p[1]]);
  for (let gen = 0; gen < generations; gen += 1) {
    const next = [];
    const scale = jitterScale / (1 + gen * 1.15);
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      next.push(a);

      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const segLen = Math.hypot(dx, dy);
      const mx = (a[0] + b[0]) * 0.5;
      const my = (a[1] + b[1]) * 0.5;
      const seed = Math.sin(mx * 1.73 + my * 2.41 + gen * 5.3) * 43758.5453;
      const rand = seed - Math.floor(seed) - 0.5;
      const nx = segLen > 0 ? -dy / segLen : 0;
      const ny = segLen > 0 ? dx / segLen : 0;
      const offset = rand * Math.min(segLen * 0.34, scale);
      next.push([mx + nx * offset, my + ny * offset]);
    }
    pts = next;
  }
  return pts;
}

function createEarthTextures() {
  const width = 1024;
  const height = 512;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext('2d');

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const sCtx = specCanvas.getContext('2d');

  const toXY = (lon, lat) => [
    ((lon + 180) / 360) * width,
    ((90 - lat) / 180) * height
  ];

  // Detailed world geography polygons (lon, lat)
  const rawLandmasses = [
    // North & Central America
    [
      [-167, 65], [-156, 71], [-138, 70], [-118, 71], [-94, 72], [-80, 66],
      [-65, 61], [-55, 52], [-66, 45], [-71, 41], [-76, 35], [-81, 26],
      [-83, 29], [-90, 29], [-97, 26], [-96, 19], [-90, 21], [-88, 17],
      [-83, 12], [-78, 8], [-82, 9], [-88, 13], [-95, 16], [-105, 19],
      [-110, 24], [-114, 30], [-118, 33], [-124, 41], [-125, 49], [-136, 58],
      [-151, 60], [-162, 56], [-167, 62]
    ],
    // Cuba / Caribbean
    [[-85, 22], [-79, 23], [-74, 20], [-78, 20]],
    // Greenland
    [[-58, 76], [-42, 83], [-18, 81], [-22, 71], [-38, 63], [-46, 60], [-53, 68]],
    // South America (featured on default facing hemisphere)
    [
      [-78, 9], [-72, 12], [-62, 10], [-51, 2], [-36, -6], [-39, -15],
      [-41, -22], [-48, -28], [-54, -35], [-62, -41], [-66, -48], [-69, -55],
      [-74, -52], [-73, -41], [-71, -30], [-71, -18], [-81, -5], [-79, 3]
    ],
    // Europe & Scandinavia & British Isles silhouette
    [
      [-9, 37], [-9, 43], [-2, 44], [2, 51], [8, 55], [5, 61], [15, 69],
      [29, 71], [44, 68], [60, 67], [60, 52], [47, 45], [38, 45], [29, 41],
      [23, 37], [16, 38], [13, 44], [7, 43], [0, 38]
    ],
    [[-6, 51], [-5, 58], [-1, 58], [1, 52], [-3, 50]],
    // Africa
    [
      [-17, 15], [-16, 27], [-6, 36], [10, 37], [24, 32], [33, 31],
      [42, 12], [51, 12], [44, 1], [40, -13], [35, -26], [20, -35],
      [15, -26], [12, -13], [9, 4], [2, 6], [-8, 5]
    ],
    // Madagascar
    [[44, -25], [47, -25], [50, -13], [48, -12], [44, -18]],
    // Asia & Arabian Peninsula & India & SE Asia
    [
      [35, 36], [42, 42], [60, 52], [62, 67], [85, 73], [112, 74],
      [142, 71], [172, 65], [160, 55], [141, 52], [132, 42], [122, 38],
      [121, 30], [109, 20], [104, 2], [98, 9], [90, 22], [80, 9],
      [73, 18], [66, 25], [57, 25], [59, 20], [45, 13], [36, 28]
    ],
    // Japan & Indonesian archipelago
    [[130, 32], [136, 35], [141, 41], [145, 44], [140, 39], [134, 34]],
    [[96, 5], [105, -6], [115, -7], [115, 2], [104, 1]],
    [[116, 0], [118, 6], [111, 2], [110, -2]],
    // Australia & New Zealand
    [
      [114, -22], [122, -17], [131, -12], [137, -15], [143, -11], [150, -21],
      [153, -29], [148, -38], [136, -35], [124, -33], [115, -34], [113, -26]
    ],
    [[167, -46], [172, -42], [177, -37], [174, -41], [169, -46]]
  ];

  const coastPolygons = rawLandmasses.map((poly) => subdivideCoast(poly, 3, 2.2));

  // Paint land mask + soft coastal shallow shelf blur
  mCtx.fillStyle = '#000000';
  mCtx.fillRect(0, 0, width, height);

  // Soft wide halo on green channel for shallow tropical coastal shelves
  mCtx.lineJoin = 'round';
  mCtx.lineCap = 'round';
  coastPolygons.forEach((poly) => {
    mCtx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const [x, y] = toXY(lon, lat);
      if (idx === 0) mCtx.moveTo(x, y);
      else mCtx.lineTo(x, y);
    });
    mCtx.closePath();
    mCtx.lineWidth = 14;
    mCtx.strokeStyle = 'rgba(0, 180, 0, 0.55)';
    mCtx.stroke();
    mCtx.lineWidth = 6;
    mCtx.strokeStyle = 'rgba(0, 240, 0, 0.85)';
    mCtx.stroke();
    mCtx.fillStyle = '#ffffff';
    mCtx.fill();
  });

  const maskData = mCtx.getImageData(0, 0, width, height).data;
  const colorImg = ctx.createImageData(width, height);
  const bumpImg = bCtx.createImageData(width, height);
  const specImg = sCtx.createImageData(width, height);

  const cD = colorImg.data;
  const bD = bumpImg.data;
  const sD = specImg.data;

  // Render organic shaded ocean bathymetry, biomes, and snow poles
  for (let py = 0; py < height; py += 1) {
    const v = py / height;
    const phi = (0.5 - v) * Math.PI; // -pi/2 .. +pi/2 latitude
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const absLat = Math.abs(phi) / (Math.PI * 0.5); // 0 equator .. 1 poles

    for (let px = 0; px < width; px += 1) {
      const u = px / width;
      const theta = u * Math.PI * 2;
      const sx = cosPhi * Math.cos(theta);
      const sy = sinPhi;
      const sz = cosPhi * Math.sin(theta);

      const idx = (py * width + px) * 4;
      const landVal = maskData[idx]; // Red channel -> interior land
      const shelfVal = maskData[idx + 1]; // Green channel -> shallow coastal water

      // Subtle continuous 3D spherical noise for organic oceans & forests
      const nMacro = fbm3(sx * 3.8 + 4.1, sy * 3.8 + 1.9, sz * 3.8 + 7.2, 3);
      const nDetail = fbm3(sx * 11.5 - 2.3, sy * 11.5 + 5.7, sz * 11.5 - 1.4, 3);

      // Polar ice cap blend (irregular undulating ice edge)
      const iceThreshold = 0.84 + (nMacro - 0.5) * 0.1;
      if (absLat > iceThreshold) {
        const iceMix = Math.min(1, (absLat - iceThreshold) * 14);
        cD[idx] = Math.round(lerp(220, 245, iceMix));
        cD[idx + 1] = Math.round(lerp(238, 250, iceMix));
        cD[idx + 2] = 252;
        cD[idx + 3] = 255;

        bD[idx] = bD[idx + 1] = bD[idx + 2] = 140;
        bD[idx + 3] = 255;
        sD[idx] = sD[idx + 1] = sD[idx + 2] = 60;
        sD[idx + 3] = 255;
        continue;
      }

      if (landVal > 128) {
        // Continent surface: blend tropical rainforest, subtropical olive/savanna, warm desert belt, highland snow
        const aridity = Math.exp(-Math.pow((absLat - 0.27) / 0.14, 2)) * (0.45 + nMacro * 0.85);
        const elevation = Math.max(0, (nDetail - 0.42) * 1.9);

        // Rich Amazon green base -> dark forest canopy -> warm savanna ochre
        let r = lerp(24, 52, nDetail);
        let g = lerp(102, 158, nDetail);
        let b = lerp(44, 68, nDetail);

        if (aridity > 0.55) {
          const dMix = Math.min(1, (aridity - 0.55) * 2.1);
          r = lerp(r, 174, dMix);
          g = lerp(g, 154, dMix);
          b = lerp(b, 92, dMix);
        }

        if (absLat > 0.55) {
          const borealMix = Math.min(1, (absLat - 0.55) * 2.4);
          r = lerp(r, 76, borealMix);
          g = lerp(g, 114, borealMix);
          b = lerp(b, 84, borealMix);
        }

        if (elevation > 0.38) {
          const ridgeMix = Math.min(1, (elevation - 0.38) * 2.2);
          r = lerp(r, 186, ridgeMix);
          g = lerp(g, 198, ridgeMix);
          b = lerp(b, 192, ridgeMix);
        }

        cD[idx] = Math.round(r);
        cD[idx + 1] = Math.round(g);
        cD[idx + 2] = Math.round(b);
        cD[idx + 3] = 255;

        const bumpV = Math.min(255, Math.round(135 + elevation * 115));
        bD[idx] = bD[idx + 1] = bD[idx + 2] = bumpV;
        bD[idx + 3] = 255;

        // Matte land
        sD[idx] = sD[idx + 1] = sD[idx + 2] = 18;
        sD[idx + 3] = 255;
      } else {
        // Deep sapphire ocean with subtle bathymetry & turquoise shallow coastal shelves
        const coastGlow = shelfVal / 255;
        const depthVar = nMacro * 0.6 + nDetail * 0.4;
        let r = lerp(8, 17, depthVar);
        let g = lerp(42, 74, depthVar);
        let b = lerp(82, 128, depthVar);

        if (coastGlow > 0.05) {
          r = lerp(r, 24, coastGlow * 0.72);
          g = lerp(g, 168, coastGlow * 0.72);
          b = lerp(b, 176, coastGlow * 0.72);
        }

        cD[idx] = Math.round(r);
        cD[idx + 1] = Math.round(g);
        cD[idx + 2] = Math.round(b);
        cD[idx + 3] = 255;

        bD[idx] = bD[idx + 1] = bD[idx + 2] = 20;
        bD[idx + 3] = 255;

        // Subtle oceanic water specular shimmer
        sD[idx] = sD[idx + 1] = sD[idx + 2] = 105;
        sD[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(colorImg, 0, 0);
  bCtx.putImageData(bumpImg, 0, 0);
  sCtx.putImageData(specImg, 0, 0);

  // Seamless 3D spherical fBM cloud map (zero ellipse straps, pure natural weather wisps)
  const cloudW = 512;
  const cloudH = 256;
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cloudW;
  cloudCanvas.height = cloudH;
  const cCtx = cloudCanvas.getContext('2d');
  const cloudImg = cCtx.createImageData(cloudW, cloudH);
  const clD = cloudImg.data;

  for (let py = 0; py < cloudH; py += 1) {
    const v = py / cloudH;
    const phi = (0.5 - v) * Math.PI;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let px = 0; px < cloudW; px += 1) {
      const u = px / cloudW;
      const theta = u * Math.PI * 2;
      // Domain warp slightly along longitude for gentle wind-sheared weather swirls
      const sx = cosPhi * Math.cos(theta);
      const sy = sinPhi;
      const sz = cosPhi * Math.sin(theta);

      const warp = fbm3(sx * 2.2 + 9.4, sy * 2.2 + 3.1, sz * 2.2 + 6.7, 2) * 0.75;
      const density = fbm3(
        (sx + warp * 0.45) * 4.4,
        (sy + warp * 0.15) * 5.2,
        (sz - warp * 0.45) * 4.4,
        4
      );

      // Delicate semi-transparent wisps (no hard streaks or heavy bands)
      const alpha = Math.max(0, Math.min(1, (density - 0.54) * 3.6));
      const idx = (py * cloudW + px) * 4;
      clD[idx] = 248;
      clD[idx + 1] = 252;
      clD[idx + 2] = 255;
      clD[idx + 3] = Math.round(alpha * 185);
    }
  }
  cCtx.putImageData(cloudImg, 0, 0);

  return {
    colorMap: new THREE.CanvasTexture(colorCanvas),
    bumpMap: new THREE.CanvasTexture(bumpCanvas),
    specularMap: new THREE.CanvasTexture(specCanvas),
    cloudMap: new THREE.CanvasTexture(cloudCanvas)
  };
}

export default function EarthGlobe3D({
  variant = 'dark',
  compact = false,
  showHint = true
}) {
  const isLight = variant === 'light';
  const mountRef = useRef(null);
  const [webglReady, setWebglReady] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
      setWebglReady(false);
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      setWebglReady(false);
      return undefined;
    }

    const fallbackWidth = compact ? 380 : 540;
    const fallbackHeight = compact ? 300 : 500;
    const width = container.clientWidth || fallbackWidth;
    const height = container.clientHeight || fallbackHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.28 : 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(compact ? 37 : 40, width / height, 0.1, 100);
    camera.position.set(0, compact ? 0.18 : 0.25, compact ? 5.75 : 6.2);

    const ambientLight = new THREE.AmbientLight(isLight ? '#d1fae5' : '#a7f3d0', isLight ? 1.15 : 0.72);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', isLight ? 2.65 : 2.35);
    sunLight.position.set(-4.2, 4.8, 5.8);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(isLight ? '#34d399' : '#4ef27a', isLight ? 1.05 : 1.35);
    rimLight.position.set(5.2, -1.2, -3.4);
    scene.add(rimLight);

    const cyanFill = new THREE.PointLight('#38bdf8', isLight ? 2.1 : 1.8, 7.5);
    cyanFill.position.set(0, -1.1, 2.2);
    scene.add(cyanFill);

    const basePivotY = compact ? 0.26 : 0.36;
    const earthPivot = new THREE.Group();
    earthPivot.position.set(0, basePivotY, 0);
    scene.add(earthPivot);

    const textures = createEarthTextures();
    textures.colorMap.colorSpace = THREE.SRGBColorSpace;
    textures.cloudMap.colorSpace = THREE.SRGBColorSpace;

    // 1. Complete 3D Earth Sphere
    const earthGeom = new THREE.SphereGeometry(1.42, 72, 72);
    const earthMat = new THREE.MeshPhongMaterial({
      map: textures.colorMap,
      bumpMap: textures.bumpMap,
      bumpScale: 0.045,
      specularMap: textures.specularMap,
      specular: new THREE.Color(isLight ? '#67e8f9' : '#38bdf8'),
      shininess: isLight ? 18 : 14
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthMesh.rotation.y = isLight ? -0.35 : -0.58;
    earthMesh.rotation.z = 0.12;
    earthPivot.add(earthMesh);

    // 2. Subtle Organic Drifting Cloud Layer Sphere
    const cloudGeom = new THREE.SphereGeometry(1.45, 64, 64);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: textures.cloudMap,
      transparent: true,
      opacity: isLight ? 0.84 : 0.78,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    earthPivot.add(cloudMesh);

    // 3. Smooth Atmospheric Halo Shader (fades cleanly to zero at outer boundary)
    const atmoGeom = new THREE.SphereGeometry(1.66, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(isLight ? '#34d399' : '#4ade80') },
        outerColor: { value: new THREE.Color(isLight ? '#22d3ee' : '#38bdf8') }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 outerColor;
        varying vec3 vNormal;
        void main() {
          float rim = clamp(-dot(vNormal, vec3(0.0, 0.0, 1.0)) * 2.15, 0.0, 1.0);
          float intensity = pow(rim, 2.2) * ${isLight ? '0.62' : '0.82'};
          vec3 mixed = mix(outerColor, glowColor, 0.45);
          gl_FragColor = vec4(mixed, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    earthPivot.add(atmoMesh);

    // 4. Orbital Energy Rings & Orbiting Satellites
    const orbitGroup = new THREE.Group();
    earthPivot.add(orbitGroup);

    const orbitSpecs = isLight
      ? [
          { radius: 1.84, tiltX: 1.28, tiltY: 0.22, color: '#06b6d4', opacity: 0.72 },
          { radius: 2.04, tiltX: 1.44, tiltY: -0.28, color: '#22c55e', opacity: 0.52 },
          { radius: 1.68, tiltX: 1.08, tiltY: 0.56, color: '#67e8f9', opacity: 0.45 }
        ]
      : [
          { radius: 1.88, tiltX: 1.24, tiltY: 0.28, color: '#5eead4', opacity: 0.56 },
          { radius: 2.12, tiltX: 1.44, tiltY: -0.34, color: '#4ade80', opacity: 0.44 },
          { radius: 1.70, tiltX: 1.04, tiltY: 0.68, color: '#a7f3d0', opacity: 0.34 }
        ];

    const disposableGeoms = [];
    const disposableMats = [];
    const satellites = [];

    orbitSpecs.forEach((spec, idx) => {
      const rGeom = new THREE.TorusGeometry(spec.radius, isLight ? 0.0085 : 0.007, 12, 120);
      const rMat = new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: spec.opacity
      });
      const rHolder = new THREE.Group();
      rHolder.rotation.x = spec.tiltX;
      rHolder.rotation.y = spec.tiltY;
      rHolder.add(new THREE.Mesh(rGeom, rMat));

      const satGeom = new THREE.SphereGeometry(0.036, 16, 16);
      const satMat = new THREE.MeshBasicMaterial({ color: isLight ? '#ecfeff' : '#d1fae5' });
      const satMesh = new THREE.Mesh(satGeom, satMat);
      rHolder.add(satMesh);

      satellites.push({
        mesh: satMesh,
        radius: spec.radius,
        angle: idx * 2.05,
        speed: 0.009 + idx * 0.004
      });

      disposableGeoms.push(rGeom, satGeom);
      disposableMats.push(rMat, satMat);
      orbitGroup.add(rHolder);
    });

    // 5. Stepped Eco-City Pedestal Stage beneath Globe
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, compact ? -1.48 : -1.52, 0);
    scene.add(pedestalGroup);

    const tierConfigs = isLight
      ? [
          { topR: 1.56, botR: 1.64, h: 0.13, y: 0.13, color: '#cbd5e1', trimColor: '#22d3ee' },
          { topR: 1.94, botR: 2.02, h: 0.15, y: 0.0, color: '#b8dbd0', trimColor: '#4ade80' },
          { topR: 2.34, botR: 2.45, h: 0.17, y: -0.15, color: '#94c4b5', trimColor: '#16a34a' }
        ]
      : [
          { topR: 1.56, botR: 1.64, h: 0.14, y: 0.14, color: '#173024', trimColor: '#5eead4' },
          { topR: 1.94, botR: 2.02, h: 0.16, y: 0.0, color: '#10241b', trimColor: '#4ade80' },
          { topR: 2.34, botR: 2.45, h: 0.18, y: -0.16, color: '#0a1913', trimColor: '#22c55e' }
        ];

    tierConfigs.forEach((tier) => {
      const cylG = new THREE.CylinderGeometry(tier.topR, tier.botR, tier.h, 64);
      const cylM = new THREE.MeshStandardMaterial({
        color: tier.color,
        roughness: isLight ? 0.42 : 0.68,
        metalness: isLight ? 0.18 : 0.24
      });
      const cyl = new THREE.Mesh(cylG, cylM);
      cyl.position.y = tier.y;
      pedestalGroup.add(cyl);

      const glowRingG = new THREE.TorusGeometry(tier.topR, 0.014, 10, 80);
      const glowRingM = new THREE.MeshBasicMaterial({
        color: tier.trimColor,
        transparent: true,
        opacity: isLight ? 0.85 : 0.78
      });
      const glowRing = new THREE.Mesh(glowRingG, glowRingM);
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.y = tier.y + tier.h / 2;
      pedestalGroup.add(glowRing);

      disposableGeoms.push(cylG, glowRingG);
      disposableMats.push(cylM, glowRingM);
    });

    const coreRingG = new THREE.TorusGeometry(0.68, 0.022, 12, 64);
    const coreRingM = new THREE.MeshBasicMaterial({
      color: isLight ? '#22d3ee' : '#67e8f9',
      transparent: true,
      opacity: 0.85
    });
    const coreRing = new THREE.Mesh(coreRingG, coreRingM);
    coreRing.rotation.x = Math.PI / 2;
    coreRing.position.y = 0.22;
    pedestalGroup.add(coreRing);
    disposableGeoms.push(coreRingG);
    disposableMats.push(coreRingM);

    // 3D Eco-City Towers & Clean Infrastructure on the Stage
    const towerMat = new THREE.MeshStandardMaterial({
      color: isLight ? '#a7d7e0' : '#1b3d35',
      roughness: isLight ? 0.28 : 0.45,
      metalness: isLight ? 0.35 : 0.4,
      emissive: isLight ? '#2a6f7f' : '#0e3628',
      emissiveIntensity: isLight ? 0.32 : 0.65
    });
    const windowMat = new THREE.MeshBasicMaterial({ color: isLight ? '#ecfeff' : '#7ee7b8' });
    disposableMats.push(towerMat, windowMat);

    const towerSpecs = isLight
      ? [
          { x: 1.48, z: -0.25, w: 0.24, d: 0.24, h: 0.94 },
          { x: 1.76, z: -0.52, w: 0.22, d: 0.22, h: 0.74 },
          { x: 1.24, z: -0.56, w: 0.20, d: 0.20, h: 0.68 },
          { x: -1.56, z: -0.45, w: 0.20, d: 0.20, h: 0.58 }
        ]
      : [
          { x: -1.62, z: -0.35, w: 0.22, d: 0.22, h: 0.78 },
          { x: -1.35, z: -0.68, w: 0.26, d: 0.24, h: 0.96 },
          { x: -1.78, z: 0.14, w: 0.18, d: 0.18, h: 0.54 },
          { x: 1.56, z: -0.45, w: 0.2, d: 0.2, h: 0.62 }
        ];

    towerSpecs.forEach((tSpec) => {
      const bG = new THREE.BoxGeometry(tSpec.w, tSpec.h, tSpec.d);
      const bMesh = new THREE.Mesh(bG, towerMat);
      bMesh.position.set(tSpec.x, 0.08 + tSpec.h / 2, tSpec.z);
      pedestalGroup.add(bMesh);

      const capG = new THREE.BoxGeometry(tSpec.w * 0.72, 0.03, tSpec.d * 0.72);
      const capMesh = new THREE.Mesh(capG, windowMat);
      capMesh.position.set(tSpec.x, 0.08 + tSpec.h + 0.02, tSpec.z);
      pedestalGroup.add(capMesh);

      disposableGeoms.push(bG, capG);
    });

    const solarPanelG = new THREE.BoxGeometry(0.46, 0.02, 0.28);
    const solarPanelM = new THREE.MeshStandardMaterial({
      color: isLight ? '#0ea5e9' : '#14628c',
      roughness: 0.22,
      metalness: 0.62,
      emissive: isLight ? '#0369a1' : '#092e46'
    });
    const solarPanel = new THREE.Mesh(solarPanelG, solarPanelM);
    solarPanel.position.set(isLight ? 1.4 : -1.35, 0.24, 1.02);
    solarPanel.rotation.x = 0.52;
    solarPanel.rotation.y = isLight ? -0.35 : 0.35;
    pedestalGroup.add(solarPanel);
    disposableGeoms.push(solarPanelG);
    disposableMats.push(solarPanelM);

    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(isLight ? -1.84 : 1.88, 0.06, 0.22);
    pedestalGroup.add(turbineGroup);

    const mastG = new THREE.CylinderGeometry(0.02, 0.03, 0.92, 10);
    const turbineMat = new THREE.MeshStandardMaterial({
      color: isLight ? '#ffffff' : '#e2f1e8',
      roughness: 0.32
    });
    const mast = new THREE.Mesh(mastG, turbineMat);
    mast.position.y = 0.46;
    turbineGroup.add(mast);

    const rotorHub = new THREE.Group();
    rotorHub.position.set(0, 0.92, 0.03);
    turbineGroup.add(rotorHub);

    const bladeG = new THREE.BoxGeometry(0.032, 0.36, 0.012);
    for (let b = 0; b < 3; b += 1) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.z = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(bladeG, turbineMat);
      blade.position.y = 0.18;
      bladeWrap.add(blade);
      rotorHub.add(bladeWrap);
    }
    disposableGeoms.push(mastG, bladeG);
    disposableMats.push(turbineMat);

    const trunkGeom = new THREE.CylinderGeometry(0.024, 0.034, 0.14, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c402c', roughness: 0.9 });
    const crownGeom = new THREE.ConeGeometry(0.115, 0.27, 7);
    const crownMatA = new THREE.MeshStandardMaterial({
      color: isLight ? '#4ade80' : '#34b85e',
      roughness: 0.55
    });
    const crownMatB = new THREE.MeshStandardMaterial({
      color: isLight ? '#16a34a' : '#1f8740',
      roughness: 0.55
    });
    disposableGeoms.push(trunkGeom, crownGeom);
    disposableMats.push(trunkMat, crownMatA, crownMatB);

    const treeAngles = [0.2, 0.65, 1.05, 1.48, 2.0, 2.45, 3.35, 3.85, 4.45, 5.1, 5.75];
    treeAngles.forEach((theta, idx) => {
      const rad = idx % 2 === 0 ? 1.45 : 1.78;
      const baseY = idx % 2 === 0 ? 0.21 : 0.08;
      const scale = 0.82 + (idx % 3) * 0.24;

      const tree = new THREE.Group();
      tree.position.set(Math.cos(theta) * rad, baseY, Math.sin(theta) * rad);
      tree.scale.setScalar(scale);

      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 0.07;
      const crown = new THREE.Mesh(crownGeom, idx % 2 === 0 ? crownMatA : crownMatB);
      crown.position.y = 0.23;

      tree.add(trunk, crown);
      pedestalGroup.add(tree);
    });

    // 6. Floating Atmospheric Particles
    const particleCount = isLight ? 72 : 110;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const r = 1.9 + Math.random() * 1.4;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.35) * 3.0;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: isLight ? '#22c55e' : '#86efac',
      size: isLight ? 0.042 : 0.036,
      transparent: true,
      opacity: isLight ? 0.62 : 0.72
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Interactive Drag with Inertia
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const canvas = renderer.domElement;
    canvas.style.touchAction = 'pan-y';

    function onPointerDown(e) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      velocityX = dx * 0.006;
      velocityY = dy * 0.004;
      earthMesh.rotation.y += velocityX;
      cloudMesh.rotation.y += velocityX;
      earthPivot.rotation.x = THREE.MathUtils.clamp(
        earthPivot.rotation.x + velocityY,
        -0.45,
        0.45
      );
      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onPointerUp() {
      isDragging = false;
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    function handleResize() {
      if (!container) return;
      const w = container.clientWidth || fallbackWidth;
      const h = container.clientHeight || fallbackHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', handleResize);

    let animId = 0;
    const clock = new THREE.Clock();

    function animate() {
      animId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) {
        velocityX *= 0.94;
        velocityY *= 0.94;
        earthMesh.rotation.y += 0.0022 + velocityX;
        cloudMesh.rotation.y += 0.0028 + velocityX;
        earthPivot.rotation.x *= 0.96;
      }

      earthPivot.position.y = basePivotY + Math.sin(t * 1.45) * 0.04;
      particles.rotation.y = t * 0.045;
      rotorHub.rotation.z -= 0.025;

      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        sat.mesh.position.set(
          Math.cos(sat.angle) * sat.radius,
          Math.sin(sat.angle) * sat.radius,
          0
        );
      });

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      earthGeom.dispose();
      earthMat.dispose();
      cloudGeom.dispose();
      cloudMat.dispose();
      atmoGeom.dispose();
      atmoMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      disposableGeoms.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      textures.colorMap.dispose();
      textures.bumpMap.dispose();
      textures.specularMap.dispose();
      textures.cloudMap.dispose();

      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [isLight, compact]);

  if (!webglReady) {
    const gradId = isLight ? 'earthFallbackOceanLight' : 'earthFallbackOceanDark';
    return (
      <div
        className={`earth-fallback-wrap${compact ? ' earth-fallback-compact' : ''}`}
        aria-label="Earth climate visual"
      >
        <svg viewBox="0 0 340 280" className="earth-fallback-svg" role="img" aria-label="Earth globe illustration">
          <defs>
            <radialGradient id={gradId} cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor={isLight ? '#38bdf8' : '#1e88b8'} />
              <stop offset="65%" stopColor={isLight ? '#0369a1' : '#0a3a60'} />
              <stop offset="100%" stopColor={isLight ? '#0c4a6e' : '#051b2e'} />
            </radialGradient>
          </defs>
          <circle
            cx="170"
            cy="126"
            r="84"
            fill={`url(#${gradId})`}
            stroke={isLight ? '#22d3ee' : '#4ade80'}
            strokeWidth="2.2"
          />
          <path
            d="M138 72 C156 68, 170 84, 162 102 C150 116, 166 128, 184 140 C196 154, 188 188, 170 200 C158 192, 160 164, 146 146 C132 130, 128 96, 138 72 Z"
            fill={isLight ? '#22c55e' : '#2e8b47'}
          />
          <ellipse
            cx="170"
            cy="128"
            rx="126"
            ry="38"
            fill="none"
            stroke={isLight ? '#22d3ee' : '#5eead4'}
            strokeWidth="2"
            strokeOpacity="0.68"
            transform="rotate(-14 170 128)"
          />
          {isLight && (
            <g>
              <rect x="220" y="168" width="14" height="58" rx="3" fill="#bae6fd" opacity="0.9" />
              <rect x="238" y="152" width="18" height="74" rx="3" fill="#7dd3fc" opacity="0.9" />
              <rect x="260" y="176" width="14" height="50" rx="3" fill="#a7f3d0" opacity="0.9" />
              <circle cx="88" cy="212" r="14" fill="#16a34a" />
              <circle cx="106" cy="208" r="16" fill="#22c55e" />
              <circle cx="122" cy="214" r="12" fill="#15803d" />
            </g>
          )}
          <ellipse
            cx="170"
            cy="236"
            rx="116"
            ry="18"
            fill={isLight ? '#cbd5e1' : '#132c20'}
            stroke={isLight ? '#4ade80' : '#4ade80'}
            strokeWidth="1.6"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`earth-canvas-stage${compact ? ' earth-canvas-compact' : ''}`}>
      <div
        ref={mountRef}
        className="earth-canvas-mount"
        aria-label="Interactive 3D Earth globe"
        role="img"
      />
      {showHint && <span className="earth-drag-hint">Drag globe to explore</span>}
    </div>
  );
}
