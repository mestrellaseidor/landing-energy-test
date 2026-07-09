// eslint-disable-next-line import/prefer-default-export
export const defaultConfig = {
  particles: {
    count: 50,
    size: 0.12,
    sizeVariation: 39,
    opacity: 0.96,
    blending: 'normal',
    shape: 'sphere',
    colors: {
      highlight: '#FCB300',
      midtone: '#FF590A',
      shadow: '#FA3354',
      accent: '#E50052',
    },
  },
  camera: {
    position: { x: 0, y: 0, z: 20 },
    lookAt: { x: 0, y: 0, z: 0 },
    fov: 21,
    zoom: 1,
    autoOrbit: { enabled: true, speed: 0.07 },
    depthOfField: {
      enabled: true,
      focusDistance: 23.5,
      focalLength: 12.5,
      bokehScale: 10.3,
    },
  },
  animation: {
    states: ['offscreen', 'chaos', 'chaos', 'chaos', 'chaos', 'chaos', 'chaos'],
    transitionDuration: 2000,
    transitionEasing: 'easeOut',
    stagger: 0.3,
    holdDuration: 6800,
    loop: 'loop',
    timeScale: 1,
  },
  forces: {
    noise: {
      enabled: true,
      amplitude: 0.006,
      frequency: 0.25,
      speed: 0.12,
    },
    gravity: { x: 0, y: 0, z: 0 },
    damping: 0.995,
  },
  background: {
    color: 'pastel',
  },
  interaction: {
    type: 'none',
    radius: 10,
    strength: 1.65,
  },
  depthLayers: {
    enabled: true,
    frontCutoff: 12,
  },
};
