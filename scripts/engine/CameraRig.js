import * as THREE from '../libs/three/three.module.js';
import { OrbitControls } from '../libs/three/OrbitControls.js';

// eslint-disable-next-line import/prefer-default-export
export class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 50);
    this.camera.position.set(0, 0, 20);

    this.controls = null;

    this.autoOrbitSpeed = 0.3;
    this.autoOrbitEnabled = true;

    this.animating = false;
    this.animProgress = 0;
    this.animDuration = 0;

    this.animPosFrom = new THREE.Vector3();
    this.animPosTo = new THREE.Vector3();
    this.animTargetFrom = new THREE.Vector3();
    this.animTargetTo = new THREE.Vector3();
  }

  initControls(domElement) {
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);
    domElement.addEventListener('contextmenu', (e) => e.stopImmediatePropagation(), { capture: true });
  }

  setScrollMode(enabled) {
    if (!this.controls) return;
    this.controls.enableZoom = !enabled;
  }

  setRotationEnabled(enabled) {
    if (!this.controls) return;
    this.controls.enableRotate = enabled;
  }

  setAutoOrbit(enabled) {
    this.autoOrbitEnabled = enabled;
  }

  applyConfig(config) {
    this.camera.position.set(config.position.x, config.position.y, config.position.z);
    this.camera.fov = config.fov;
    this.camera.zoom = config.zoom;
    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.set(config.lookAt.x, config.lookAt.y, config.lookAt.z);
    }

    this.autoOrbitEnabled = config.autoOrbit.enabled;
    this.autoOrbitSpeed = config.autoOrbit.speed;
  }

  animateTo(position, lookAt, duration) {
    this.animPosFrom.copy(this.camera.position);
    this.animPosTo.set(position.x, position.y, position.z);
    this.animTargetFrom.copy(this.controls.target);
    this.animTargetTo.set(lookAt.x, lookAt.y, lookAt.z);
    this.animDuration = duration;
    this.animProgress = 0;
    this.animating = true;
  }

  cancelAnimation() {
    this.animating = false;
  }

  get isAnimating() {
    return this.animating;
  }

  update(deltaMs) {
    if (this.animating) {
      this.animProgress += deltaMs;
      const raw = Math.min(this.animProgress / this.animDuration, 1);
      const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - (-2 * raw + 2) ** 3 / 2;

      this.camera.position.lerpVectors(this.animPosFrom, this.animPosTo, t);
      this.controls.target.lerpVectors(this.animTargetFrom, this.animTargetTo, t);
      this.camera.lookAt(this.controls.target);

      if (raw >= 1) {
        this.animating = false;
        this.camera.position.copy(this.animPosTo);
        this.controls.target.copy(this.animTargetTo);
        this.controls.enableDamping = false;
        this.controls.update();
        this.controls.enableDamping = true;
      }
    } else if (this.autoOrbitEnabled) {
      const angle = (deltaMs / 1000) * this.autoOrbitSpeed;
      const pos = this.camera.position;
      const target = this.controls ? this.controls.target : new THREE.Vector3();
      const dx = pos.x - target.x;
      const dz = pos.z - target.z;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      pos.x = target.x + dx * cos - dz * sin;
      pos.z = target.z + dx * sin + dz * cos;
      this.camera.lookAt(target);
    }

    if (this.controls && !this.animating) {
      this.controls.update();
    }
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.controls?.dispose();
  }

  resetToFront(position, duration = 600) {
    const target = this.controls ? this.controls.target : new THREE.Vector3();
    this.animateTo(position, { x: target.x, y: target.y, z: target.z }, duration);
  }
}
