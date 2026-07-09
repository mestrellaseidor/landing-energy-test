import {
  Vector2,
  Vector3,
  Raycaster,
  Plane,
} from '../libs/three/three.core.js';

// Reusable objects (evita GC en loops)
// eslint-disable-next-line no-underscore-dangle
const _mouse = new Vector2();
// eslint-disable-next-line no-underscore-dangle
const _raycaster = new Raycaster();
// eslint-disable-next-line no-underscore-dangle
const _plane = new Plane(new Vector3(0, 0, 1), 0);
// eslint-disable-next-line no-underscore-dangle
const _intersection = new Vector3();
// eslint-disable-next-line no-underscore-dangle
const _dir = new Vector3();

// eslint-disable-next-line import/prefer-default-export
export class MouseInteraction {
  constructor() {
    this.mouseWorld = new Vector3();
    this.isActive = false;
  }

  updateMouse(event, camera, canvas) {
    const rect = canvas.getBoundingClientRect();

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, camera);

    const cameraDir = new Vector3();
    camera.getWorldDirection(cameraDir);

    _plane.normal.copy(cameraDir);
    _plane.constant = 0;

    _raycaster.ray.intersectPlane(_plane, _intersection);

    if (_intersection) {
      this.mouseWorld.copy(_intersection);
      this.isActive = true;
    }
  }

  deactivate() {
    this.isActive = false;
  }

  apply(positions, velocities, config) {
    if (!this.isActive || config.type === 'none') return;

    const { radius, strength, type } = config;
    const radiusSq = radius * radius;
    const sign = type === 'attract' ? 1 : -1;

    for (let i = 0; i < positions.length; i++) {
      _dir.subVectors(this.mouseWorld, positions[i]);

      const distSq = _dir.lengthSq();

      if (distSq < radiusSq && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / radius) * strength * sign;

        _dir.normalize().multiplyScalar(force);
        velocities[i].add(_dir);
      }
    }
  }
}
