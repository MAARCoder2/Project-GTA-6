import * as THREE from 'three';
import type { BoundingBox3D } from './types.ts';

export interface WorldCollisionData {
  boxes: BoundingBox3D[];
  groundElevation: (x: number, z: number) => number;
}

export interface CityWaypoint {
  id: string;
  x: number;
  z: number;
  type: 'ROAD' | 'SIDEWALK';
  connections: string[];
}

export interface CityDistrict {
  sceneGroup: THREE.Group;
  collision: WorldCollisionData;
  waypoints: CityWaypoint[];
  roadWaypoints: CityWaypoint[];
  sidewalkWaypoints: CityWaypoint[];
  districtSize: number;
}

/**
 * Generate procedural canvas textures for realistic city surfaces.
 */
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark asphalt base with subtle aggregate noise
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Road markings: center double-yellow line
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(250, 0, 4, 512);
  ctx.fillRect(258, 0, 4, 512);

  // Outer dashed white lane lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let y = 10; y < 512; y += 40) {
    ctx.fillRect(124, y, 4, 22);
    ctx.fillRect(384, y, 4, 22);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 256, 256);

  // Concrete tile grid joints
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 128, 128);
  ctx.strokeRect(128, 0, 128, 128);
  ctx.strokeRect(0, 128, 128, 128);
  ctx.strokeRect(128, 128, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSkyscraperTexture(baseColor = '#1e293b', windowColor = '#93c5fd'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 512);

  // Window grid with random lit/unlit states
  const cols = 8;
  const rows = 24;
  const wWidth = 20;
  const wHeight = 14;
  const gapX = 11;
  const gapY = 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.35;
      if (isLit) {
        ctx.fillStyle = Math.random() > 0.4 ? windowColor : '#fde047';
      } else {
        ctx.fillStyle = '#0f172a';
      }
      ctx.fillRect(10 + c * (wWidth + gapX), 12 + r * (wHeight + gapY), wWidth, wHeight);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Builds the entire 3D city district, collision bounding boxes, and navigation waypoints.
 */
export function buildCityDistrict(): CityDistrict {
  const sceneGroup = new THREE.Group();
  sceneGroup.name = 'CityDistrict';

  const collisionBoxes: BoundingBox3D[] = [];
  const waypoints: CityWaypoint[] = [];
  const roadWaypoints: CityWaypoint[] = [];
  const sidewalkWaypoints: CityWaypoint[] = [];

  const districtSize = 240; // 240m x 240m total area (-120 to +120)
  const halfSize = districtSize / 2;

  // Materials
  const asphaltTex = createAsphaltTexture();
  asphaltTex.repeat.set(1, 10);
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const sidewalkTex = createSidewalkTexture();
  sidewalkTex.repeat.set(6, 6);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.9,
    metalness: 0.05,
  });

  const curbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.8,
  });

  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.95,
  });

  // Base ground plate
  const groundGeo = new THREE.PlaneGeometry(districtSize + 40, districtSize + 40);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 1.0 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.05;
  groundMesh.receiveShadow = true;
  sceneGroup.add(groundMesh);

  // 4 Major Avenues (North-South & East-West)
  // Grid layout: Street corridors at x = -70, x = 0, x = 70
  // and z = -70, z = 0, z = 70
  // Street width = 14m
  const streetWidth = 14;
  const streetCoords = [-70, 0, 70];

  // Roads
  for (const x of streetCoords) {
    const roadGeo = new THREE.PlaneGeometry(streetWidth, districtSize);
    const road = new THREE.Mesh(roadGeo, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.01, 0);
    road.receiveShadow = true;
    sceneGroup.add(road);
  }

  for (const z of streetCoords) {
    const roadGeo = new THREE.PlaneGeometry(districtSize, streetWidth);
    const road = new THREE.Mesh(roadGeo, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = Math.PI / 2;
    road.position.set(0, 0.02, z);
    road.receiveShadow = true;
    sceneGroup.add(road);
  }

  // Crosswalks at intersections
  const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of streetCoords) {
    for (const sz of streetCoords) {
      // 4 crosswalk strips around intersection box
      const offsets = [
        { x: sx, z: sz - streetWidth * 0.65, w: streetWidth * 0.85, h: 2.2, rot: 0 },
        { x: sx, z: sz + streetWidth * 0.65, w: streetWidth * 0.85, h: 2.2, rot: 0 },
        { x: sx - streetWidth * 0.65, z: sz, w: 2.2, h: streetWidth * 0.85, rot: 0 },
        { x: sx + streetWidth * 0.65, z: sz, w: 2.2, h: streetWidth * 0.85, rot: 0 },
      ];
      for (const cw of offsets) {
        const cwGeo = new THREE.PlaneGeometry(cw.w, cw.h);
        const cwMesh = new THREE.Mesh(cwGeo, crosswalkMat);
        cwMesh.rotation.x = -Math.PI / 2;
        cwMesh.position.set(cw.x, 0.03, cw.z);
        sceneGroup.add(cwMesh);
      }
    }
  }

  // Define 9 Blocks (3x3 grid)
  // Block centers and dimensions:
  // x ranges: [-110, -80], [-55, -15], [15, 55], [80, 110]
  // Simplified block boundaries:
  interface BlockDef {
    id: string;
    name: string;
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    theme: 'FINANCIAL' | 'COMMERCIAL' | 'POLICE' | 'RESIDENTIAL' | 'PARK' | 'TRANSIT' | 'INDUSTRIAL' | 'CONSTRUCTION' | 'WATERFRONT';
  }

  const blocks: BlockDef[] = [
    { id: 'b00', name: 'Financial Core', centerX: -35, centerZ: -35, width: 50, depth: 50, theme: 'FINANCIAL' },
    { id: 'b10', name: 'Commercial Square', centerX: 35, centerZ: -35, width: 50, depth: 50, theme: 'COMMERCIAL' },
    { id: 'b20', name: 'Metro Police Precinct', centerX: 105, centerZ: -35, width: 44, depth: 50, theme: 'POLICE' },
    { id: 'b01', name: 'Residential District', centerX: -35, centerZ: 35, width: 50, depth: 50, theme: 'RESIDENTIAL' },
    { id: 'b11', name: 'Central Plaza Park', centerX: 35, centerZ: 35, width: 50, depth: 50, theme: 'PARK' },
    { id: 'b21', name: 'Grand Transit Hub', centerX: 105, centerZ: 35, width: 44, depth: 50, theme: 'TRANSIT' },
    { id: 'b02', name: 'Apex Freight Depots', centerX: -35, centerZ: 105, width: 50, depth: 44, theme: 'INDUSTRIAL' },
    { id: 'b12', name: 'Skyline Construction', centerX: 35, centerZ: 105, width: 50, depth: 44, theme: 'CONSTRUCTION' },
    { id: 'b22', name: 'Harbor Waterfront', centerX: 105, centerZ: 105, width: 44, depth: 44, theme: 'WATERFRONT' },
    // Outer West row
    { id: 'bw0', name: 'West Commercial', centerX: -105, centerZ: -35, width: 44, depth: 50, theme: 'COMMERCIAL' },
    { id: 'bw1', name: 'West Residential', centerX: -105, centerZ: 35, width: 44, depth: 50, theme: 'RESIDENTIAL' },
    { id: 'bw2', name: 'West Warehouses', centerX: -105, centerZ: 105, width: 44, depth: 44, theme: 'INDUSTRIAL' },
  ];

  // Helper: create concrete sidewalk perimeter around a block
  function createBlockSidewalk(b: BlockDef) {
    const swHeight = 0.22;
    const swGeo = new THREE.BoxGeometry(b.width, swHeight, b.depth);
    const swMesh = new THREE.Mesh(swGeo, b.theme === 'PARK' ? grassMaterial : sidewalkMaterial);
    swMesh.position.set(b.centerX, swHeight / 2, b.centerZ);
    swMesh.receiveShadow = true;
    sceneGroup.add(swMesh);

    // Curb edge trims
    const curbGeo = new THREE.BoxGeometry(b.width + 0.3, 0.1, b.depth + 0.3);
    const curbMesh = new THREE.Mesh(curbGeo, curbMaterial);
    curbMesh.position.set(b.centerX, 0.05, b.centerZ);
    sceneGroup.add(curbMesh);
  }

  // Populate each block with themed architecture & collision hulls
  for (const b of blocks) {
    createBlockSidewalk(b);

    if (b.theme === 'FINANCIAL') {
      // Skyscraper 1: 72m tall tower
      const towerHeight = 72;
      const towerGeo = new THREE.BoxGeometry(28, towerHeight, 28);
      const towerMat = new THREE.MeshStandardMaterial({
        map: createSkyscraperTexture('#0f172a', '#38bdf8'),
        roughness: 0.2,
        metalness: 0.7,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(b.centerX - 5, towerHeight / 2 + 0.22, b.centerZ - 5);
      tower.castShadow = true;
      tower.receiveShadow = true;
      sceneGroup.add(tower);

      collisionBoxes.push({
        min: { x: b.centerX - 19, y: 0, z: b.centerZ - 19 },
        max: { x: b.centerX + 9, y: towerHeight, z: b.centerZ + 9 },
      });

      // Secondary glass office building
      const subHeight = 36;
      const subGeo = new THREE.BoxGeometry(16, subHeight, 22);
      const subMat = new THREE.MeshStandardMaterial({
        map: createSkyscraperTexture('#1e293b', '#fbbf24'),
        roughness: 0.3,
        metalness: 0.5,
      });
      const sub = new THREE.Mesh(subGeo, subMat);
      sub.position.set(b.centerX + 13, subHeight / 2 + 0.22, b.centerZ + 8);
      sub.castShadow = true;
      sceneGroup.add(sub);

      collisionBoxes.push({
        min: { x: b.centerX + 5, y: 0, z: b.centerZ - 3 },
        max: { x: b.centerX + 21, y: subHeight, z: b.centerZ + 19 },
      });
    } else if (b.theme === 'POLICE') {
      // Police Station: 18m civic stone & dark metal with blue accent lights
      const pdHeight = 18;
      const pdGeo = new THREE.BoxGeometry(32, pdHeight, 36);
      const pdMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.3,
      });
      const pd = new THREE.Mesh(pdGeo, pdMat);
      pd.position.set(b.centerX, pdHeight / 2 + 0.22, b.centerZ - 4);
      pd.castShadow = true;
      sceneGroup.add(pd);

      collisionBoxes.push({
        min: { x: b.centerX - 16, y: 0, z: b.centerZ - 22 },
        max: { x: b.centerX + 16, y: pdHeight, z: b.centerZ + 14 },
      });

      // Helipad roof marker
      const heliPadGeo = new THREE.CylinderGeometry(6, 6, 0.4, 24);
      const heliPadMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const helipad = new THREE.Mesh(heliPadGeo, heliPadMat);
      helipad.position.set(b.centerX, pdHeight + 0.4, b.centerZ - 4);
      sceneGroup.add(helipad);
    } else if (b.theme === 'PARK') {
      // Central Park: Trees, stone benches, monument
      // Monument in center
      const monBaseGeo = new THREE.BoxGeometry(6, 2, 6);
      const monMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
      const monBase = new THREE.Mesh(monBaseGeo, monMat);
      monBase.position.set(b.centerX, 1.2, b.centerZ);
      sceneGroup.add(monBase);

      const monSpireGeo = new THREE.ConeGeometry(1.8, 10, 8);
      const monSpire = new THREE.Mesh(monSpireGeo, monMat);
      monSpire.position.set(b.centerX, 7, b.centerZ);
      sceneGroup.add(monSpire);

      collisionBoxes.push({
        min: { x: b.centerX - 3, y: 0, z: b.centerZ - 3 },
        max: { x: b.centerX + 3, y: 12, z: b.centerZ + 3 },
      });

      // 8 Park Trees
      const treeOffsets = [
        [-14, -14], [14, -14], [-14, 14], [14, 14],
        [-18, 0], [18, 0], [0, -18], [0, 18],
      ];
      for (const [tx, tz] of treeOffsets) {
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4.5, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(b.centerX + tx, 2.25, b.centerZ + tz);
        sceneGroup.add(trunk);

        // Foliage
        const leavesGeo = new THREE.DodecahedronGeometry(2.8, 1);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(b.centerX + tx, 5.8, b.centerZ + tz);
        leaves.castShadow = true;
        sceneGroup.add(leaves);

        collisionBoxes.push({
          min: { x: b.centerX + tx - 0.7, y: 0, z: b.centerZ + tz - 0.7 },
          max: { x: b.centerX + tx + 0.7, y: 7, z: b.centerZ + tz + 0.7 },
        });
      }
    } else if (b.theme === 'INDUSTRIAL') {
      // Warehouse depot (Mission 3 target extraction site)
      const whHeight = 14;
      const whGeo = new THREE.BoxGeometry(38, whHeight, 26);
      const whMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.7,
        metalness: 0.6,
      });
      const wh = new THREE.Mesh(whGeo, whMat);
      wh.position.set(b.centerX, whHeight / 2 + 0.22, b.centerZ - 5);
      wh.castShadow = true;
      sceneGroup.add(wh);

      collisionBoxes.push({
        min: { x: b.centerX - 19, y: 0, z: b.centerZ - 18 },
        max: { x: b.centerX + 19, y: whHeight, z: b.centerZ + 8 },
      });

      // Cargo shipping containers in alley
      const colors = [0xd97706, 0x2563eb, 0xdc2626];
      const containerPositions = [
        { x: b.centerX - 12, z: b.centerZ + 14, rot: 0, c: colors[0] },
        { x: b.centerX + 4, z: b.centerZ + 14, rot: 0, c: colors[1] },
        { x: b.centerX - 12, z: b.centerZ + 14, y: 2.8, rot: 0.05, c: colors[2] },
      ];
      for (const cp of containerPositions) {
        const cGeo = new THREE.BoxGeometry(10, 2.6, 3.5);
        const cMat = new THREE.MeshStandardMaterial({ color: cp.c, roughness: 0.5, metalness: 0.4 });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(cp.x, (cp.y || 0) + 1.4 + 0.22, cp.z);
        cMesh.rotation.y = cp.rot;
        cMesh.castShadow = true;
        sceneGroup.add(cMesh);

        collisionBoxes.push({
          min: { x: cp.x - 5.1, y: cp.y || 0, z: cp.z - 1.8 },
          max: { x: cp.x + 5.1, y: (cp.y || 0) + 2.8, z: cp.z + 1.8 },
        });
      }
    } else if (b.theme === 'CONSTRUCTION') {
      // Multi-story steel frame building with ramp
      const constrHeight = 24;
      const constrGeo = new THREE.BoxGeometry(32, constrHeight, 32);
      const constrMat = new THREE.MeshStandardMaterial({
        color: 0x78716c,
        roughness: 0.8,
        wireframe: false,
      });
      const constr = new THREE.Mesh(constrGeo, constrMat);
      constr.position.set(b.centerX, constrHeight / 2 + 0.22, b.centerZ);
      constr.castShadow = true;
      sceneGroup.add(constr);

      collisionBoxes.push({
        min: { x: b.centerX - 16, y: 0, z: b.centerZ - 16 },
        max: { x: b.centerX + 16, y: constrHeight, z: b.centerZ + 16 },
      });
    } else {
      // Commercial & Residential blocks (two mid-rise buildings per block)
      const h1 = 28 + (Math.abs(b.centerX + b.centerZ) % 20);
      const b1Geo = new THREE.BoxGeometry(20, h1, 38);
      const b1Mat = new THREE.MeshStandardMaterial({
        map: createSkyscraperTexture(b.theme === 'RESIDENTIAL' ? '#473d31' : '#1e293b', '#e2e8f0'),
        roughness: 0.5,
        metalness: 0.2,
      });
      const b1 = new THREE.Mesh(b1Geo, b1Mat);
      b1.position.set(b.centerX - 10, h1 / 2 + 0.22, b.centerZ);
      b1.castShadow = true;
      sceneGroup.add(b1);

      collisionBoxes.push({
        min: { x: b.centerX - 20, y: 0, z: b.centerZ - 19 },
        max: { x: b.centerX, y: h1, z: b.centerZ + 19 },
      });

      const h2 = 20 + ((b.centerX * 7) % 15);
      const b2Geo = new THREE.BoxGeometry(16, h2, 38);
      const b2Mat = new THREE.MeshStandardMaterial({
        map: createSkyscraperTexture('#334155', '#fed7aa'),
        roughness: 0.6,
      });
      const b2 = new THREE.Mesh(b2Geo, b2Mat);
      b2.position.set(b.centerX + 12, h2 / 2 + 0.22, b.centerZ);
      b2.castShadow = true;
      sceneGroup.add(b2);

      collisionBoxes.push({
        min: { x: b.centerX + 4, y: 0, z: b.centerZ - 19 },
        max: { x: b.centerX + 20, y: h2, z: b.centerZ + 19 },
      });
    }
  }

  // Streetlamps along sidewalks
  const lampGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
  const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  for (const sx of streetCoords) {
    for (let z = -100; z <= 100; z += 40) {
      if (Math.abs(z) === 70 || z === 0) continue; // skip intersection center
      for (const side of [-1, 1]) {
        const lx = sx + side * (streetWidth / 2 + 1.2);
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(lx, 3, z);
        sceneGroup.add(lamp);

        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(lx, 6, z);
        sceneGroup.add(bulb);

        collisionBoxes.push({
          min: { x: lx - 0.25, y: 0, z: z - 0.25 },
          max: { x: lx + 0.25, y: 6.2, z: z + 0.25 },
        });
      }
    }
  }

  // District perimeter barriers (-118 to +118)
  const barrierThickness = 3.0;
  const barrierHeight = 6.0;
  // North barrier
  collisionBoxes.push({
    min: { x: -halfSize, y: 0, z: -halfSize - barrierThickness },
    max: { x: halfSize, y: barrierHeight, z: -halfSize },
  });
  // South barrier
  collisionBoxes.push({
    min: { x: -halfSize, y: 0, z: halfSize },
    max: { x: halfSize, y: barrierHeight, z: halfSize + barrierThickness },
  });
  // West barrier
  collisionBoxes.push({
    min: { x: -halfSize - barrierThickness, y: 0, z: -halfSize },
    max: { x: -halfSize, y: barrierHeight, z: halfSize },
  });
  // East barrier
  collisionBoxes.push({
    min: { x: halfSize, y: 0, z: -halfSize },
    max: { x: halfSize + barrierThickness, y: barrierHeight, z: halfSize },
  });

  // Generate Navigation Waypoints
  // Road waypoints: placed along the street centerlines
  let wpId = 0;
  for (const sx of streetCoords) {
    for (let z = -100; z <= 100; z += 25) {
      const wp: CityWaypoint = {
        id: `rw_${wpId++}`,
        x: sx,
        z,
        type: 'ROAD',
        connections: [],
      };
      roadWaypoints.push(wp);
      waypoints.push(wp);
    }
  }
  for (const sz of streetCoords) {
    for (let x = -100; x <= 100; x += 25) {
      if (streetCoords.includes(x)) continue; // already added at intersection
      const wp: CityWaypoint = {
        id: `rw_${wpId++}`,
        x,
        z: sz,
        type: 'ROAD',
        connections: [],
      };
      roadWaypoints.push(wp);
      waypoints.push(wp);
    }
  }

  // Sidewalk waypoints: placed on block perimeters
  for (const b of blocks) {
    const swOffsets = [
      { x: b.centerX - b.width / 2 + 2, z: b.centerZ - b.depth / 2 + 2 },
      { x: b.centerX + b.width / 2 - 2, z: b.centerZ - b.depth / 2 + 2 },
      { x: b.centerX + b.width / 2 - 2, z: b.centerZ + b.depth / 2 - 2 },
      { x: b.centerX - b.width / 2 + 2, z: b.centerZ + b.depth / 2 - 2 },
    ];
    for (const off of swOffsets) {
      const swWp: CityWaypoint = {
        id: `sw_${wpId++}`,
        x: off.x,
        z: off.z,
        type: 'SIDEWALK',
        connections: [],
      };
      sidewalkWaypoints.push(swWp);
      waypoints.push(swWp);
    }
  }

  // Ground elevation function
  const groundElevation = (x: number, z: number): number => {
    // Check if inside any block sidewalk (y = 0.22) or road (y = 0.0)
    for (const b of blocks) {
      if (
        x >= b.centerX - b.width / 2 &&
        x <= b.centerX + b.width / 2 &&
        z >= b.centerZ - b.depth / 2 &&
        z <= b.centerZ + b.depth / 2
      ) {
        return 0.22;
      }
    }
    return 0.0;
  };

  return {
    sceneGroup,
    collision: {
      boxes: collisionBoxes,
      groundElevation,
    },
    waypoints,
    roadWaypoints,
    sidewalkWaypoints,
    districtSize,
  };
}
