import { Vector3 } from '../libs/three/three.core.js';

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function hash(x, y, z) {
  // eslint-disable-next-line no-bitwise
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  // eslint-disable-next-line no-bitwise
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  // eslint-disable-next-line no-bitwise
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function grad(h, x, y, z) {
  // eslint-disable-next-line no-bitwise
  const bits = (h * 15485863 | 0) & 15;
  const u = bits < 8 ? x : y;
  // eslint-disable-next-line no-nested-ternary
  const v = bits < 4 ? y : bits === 12 || bits === 14 ? x : z;
  // eslint-disable-next-line no-bitwise
  return ((bits & 1) === 0 ? u : -u) + ((bits & 2) === 0 ? v : -v);
}

function smoothNoise3D(x, y, z) {
  const ix = Math.floor(x); const iy = Math.floor(y); const
    iz = Math.floor(z);
  const fx = x - ix; const fy = y - iy; const
    fz = z - iz;

  const u = fade(fx); const v = fade(fy); const
    w = fade(fz);

  return lerp(
    lerp(
      lerp(
        grad(hash(ix, iy, iz), fx, fy, fz),
        grad(hash(ix + 1, iy, iz), fx - 1, fy, fz),
        u,
      ),
      lerp(
        grad(hash(ix, iy + 1, iz), fx, fy - 1, fz),
        grad(hash(ix + 1, iy + 1, iz), fx - 1, fy - 1, fz),
        u,
      ),
      v,
    ),
    lerp(
      lerp(
        grad(hash(ix, iy, iz + 1), fx, fy, fz - 1),
        grad(hash(ix + 1, iy, iz + 1), fx - 1, fy, fz - 1),
        u,
      ),
      lerp(
        grad(hash(ix, iy + 1, iz + 1), fx, fy - 1, fz - 1),
        grad(hash(ix + 1, iy + 1, iz + 1), fx - 1, fy - 1, fz - 1),
        u,
      ),
      v,
    ),
    w,
  );
}

const noiseOffsets = [];

// Immutable zero vector
// eslint-disable-next-line no-underscore-dangle
const _zero = new Vector3();

export function getNoiseOffset(index) {
  return noiseOffsets[index] ?? _zero;
}

export function computeNoiseOffsets(count, config, time) {
  while (noiseOffsets.length < count) {
    noiseOffsets.push(new Vector3());
  }

  const { noise } = config;

  if (!noise.enabled) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      noiseOffsets[i].set(0, 0, 0);
    }
    return;
  }

  const freq = noise.frequency;
  const amp = noise.amplitude;
  const t = time * noise.speed;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < count; i++) {
    const seed = i * 73.1;

    noiseOffsets[i].set(
      smoothNoise3D(seed + t, 31.7, 7.3) * amp / freq,
      smoothNoise3D(47.1, seed + t, 93.5) * amp / freq,
      smoothNoise3D(71.9, 59.3, seed + t) * amp / freq,
    );
  }
}
