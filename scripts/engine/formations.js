import { Vector3 } from '../libs/three/three.core.js';

const PHI = (1 + Math.sqrt(5)) / 2;

let mokaPositions = null;

export function setMokaPositions(data) {
  mokaPositions = data;
}

// ================================
// FORMATIONS
// ================================
let chaosSeed = 0;
let offscreenSeed = 0;

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

const formations = {
  offscreen(index) {
    const angle = seededRandom(index * 2 + offscreenSeed * 1000) * Math.PI * 2;
    const r = 30 + seededRandom(index * 2 + 1 + offscreenSeed * 1000) * 20;
    return new Vector3(
      Math.cos(angle) * r,
      (seededRandom(index * 3 + offscreenSeed * 1000) - 0.5) * r,
      Math.sin(angle) * r,
    );
  },

  chaos(index) {
    const spread = 8;
    return new Vector3(
      (seededRandom(index * 3 + chaosSeed * 1000) - 0.5) * spread * 2,
      (seededRandom(index * 3 + 1 + chaosSeed * 1000) - 0.5) * spread * 2,
      (seededRandom(index * 3 + 2 + chaosSeed * 1000) - 0.5) * spread * 2,
    );
  },

  sphere(index, total) {
    const radius = 5;
    const y = 1 - (index / (total - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = ((index % total) * 2 * Math.PI) / PHI;

    return new Vector3(
      Math.cos(theta) * radiusAtY * radius,
      y * radius,
      Math.sin(theta) * radiusAtY * radius,
    );
  },

  grid(index, total) {
    const side = Math.ceil(Math.cbrt(total));
    const spacing = 10 / side;

    const ix = index % side;
    const iy = Math.floor(index / side) % side;
    const iz = Math.floor(index / (side * side));

    const offset = (side - 1) * spacing * 0.5;

    return new Vector3(
      ix * spacing - offset,
      iy * spacing - offset,
      iz * spacing - offset,
    );
  },

  helix(index, total) {
    const t = (index / total) * Math.PI * 6;
    const radius = 4;
    const height = 10;

    const y = (index / total) * height - height / 2;
    const strand = index % 2 === 0 ? 0 : Math.PI;

    return new Vector3(
      Math.cos(t + strand) * radius,
      y,
      Math.sin(t + strand) * radius,
    );
  },

  torus(index, total) {
    const R = 5;
    const r = 1.8;

    const u = (index / total) * Math.PI * 2;
    const v = ((index * PHI * total) % total / total) * Math.PI * 2;

    return new Vector3(
      (R + r * Math.cos(v)) * Math.cos(u),
      r * Math.sin(v),
      (R + r * Math.cos(v)) * Math.sin(u),
    );
  },

  wave(index, total) {
    const side = Math.ceil(Math.sqrt(total));
    const spacing = 12 / side;

    const ix = index % side;
    const iz = Math.floor(index / side);

    const offset = (side - 1) * spacing * 0.5;

    const x = ix * spacing - offset;
    const z = iz * spacing - offset;
    const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2;

    return new Vector3(x, y, z);
  },

  ring(index, total) {
    const radius = 5;
    const angle = (index / total) * Math.PI * 2;

    return new Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    );
  },

  moka(index, total) {
    if (!mokaPositions || mokaPositions.length === 0) {
      return formations.chaos(index, total);
    }

    const i = index % mokaPositions.length;
    const p = mokaPositions[i];

    return new Vector3(p[0], p[1], p[2]);
  },
};

// ================================
// API
// ================================

export function getFormationPositions(type, count) {
  // eslint-disable-next-line no-plusplus
  if (type === 'chaos') chaosSeed++;
  // eslint-disable-next-line no-plusplus
  if (type === 'offscreen') offscreenSeed++;

  const fn = formations[type] || formations.chaos;
  const positions = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < count; i++) {
    positions.push(fn(i, count));
  }
  return positions;
}

export function getFormationNames() {
  return Object.keys(formations);
}
