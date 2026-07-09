/* eslint-disable */
import * as THREE from '../libs/three/three.module.js';
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  SphereGeometry,
  AdditiveBlending,
  NormalBlending,
} from '../libs/three/three.core.js';
import {
  attribute,
  clamp,
  dot,
  float,
  mix,
  normalize,
  normalView,
  uniform,
} from '../libs/three/three.tsl.js';
import { MeshBasicNodeMaterial } from '../libs/three/three.webgpu.js';
import { computeNoiseOffsets, getNoiseOffset } from './forces.js';
import { StateAnimator } from './StateAnimator.js';
import { MouseInteraction } from './MouseInteraction.js';

// eslint-disable-next-line import/prefer-default-export
// Module-level reusable objects
const _matrix = new Matrix4();
const _scale = new THREE.Vector3();
const _viewPos = new THREE.Vector3();
const _pos = new THREE.Vector3();

export class ParticleSystem {
  constructor() {
    this.backMesh = null;
    this.frontMesh = null;

    this.animator = new StateAnimator();
    this.interaction = new MouseInteraction();

    this.chartMode = {
      active: false,
      chartType: 'bar',
      phase: 'idle',
      targets: [],
      dotSize: 0.15,
      elapsed: 0,
      arrivedElapsed: 0,
      shrinkElapsed: 0,
      shrinkDuration: 250,
      flyDuration: 1500,
      frozenFrontIndices: [],
      groupCenters: [],
      popScale: 1,
    };

    this.screenAnchorMode = {
      active: false,
      phase: 'idle',
      targets: [],
      elapsed: 0,
      flyDuration: 2500,
      arrivedElapsed: 0,
      expandElapsed: 0,
      expandDuration: 700,
      groupCenters: [],
    };

    this.velocities = [];
    this._lastFrontIndices = [];
    this._frontAvgViewZ = 0;

    this.material = null;
    this.frontMaterial = null;

    this.uHighlight = uniform(new Color('#FCB300'));
    this.uMidtone = uniform(new Color('#FF590A'));
    this.uShadow = uniform(new Color('#FA3354'));
    this.uAccent = uniform(new Color('#E50052'));
    this.uLightDir = uniform(new THREE.Vector3(0.6, 0.8, 0.5).normalize());
    this.uChartColor = uniform(new Color('#FA3354'));

    this.backBlendArray = null;
    this.frontBlendArray = null;
    this.backBlendAttr = null;
    this.frontBlendAttr = null;

    this.config = null;
  }

  get mesh() {
    return this.backMesh;
  }

  get lastFrontIndices() {
    return this._lastFrontIndices;
  }

  get frontAvgViewZ() {
    return this._frontAvgViewZ;
  }

  init(config) {
    this.config = config;
    const { count, size } = config.particles;

    this.uHighlight.value.set(config.particles.colors.highlight);
    this.uMidtone.value.set(config.particles.colors.midtone);
    this.uShadow.value.set(config.particles.colors.shadow);
    this.uAccent.value.set(config.particles.colors.accent);

    const geometry = new SphereGeometry(size, 24, 16);
    this.material = this.createMaterial(config);
    this.frontMaterial = this.createMaterial(config);

    this.backMesh = new InstancedMesh(geometry, this.material, count);
    this.backMesh.frustumCulled = false;

    this.frontMesh = new InstancedMesh(geometry.clone(), this.frontMaterial, count);
    this.frontMesh.frustumCulled = false;
    this.frontMesh.count = 0;

    this.backBlendArray = new Float32Array(count);
    this.frontBlendArray = new Float32Array(count);
    this.backBlendAttr = new InstancedBufferAttribute(this.backBlendArray, 1);
    this.frontBlendAttr = new InstancedBufferAttribute(this.frontBlendArray, 1);

    this.backMesh.geometry.setAttribute('chartBlend', this.backBlendAttr);
    this.frontMesh.geometry.setAttribute('chartBlend', this.frontBlendAttr);

    this.velocities = Array.from({ length: count }, () => new THREE.Vector3());

    this.animator.states = config.animation.states;
    this.animator.transitionDuration = config.animation.transitionDuration;
    this.animator.easing = config.animation.transitionEasing;
    this.animator.stagger = config.animation.stagger;
    this.animator.holdDuration = config.animation.holdDuration;
    this.animator.loop = config.animation.loop;
    this.animator.timeScale = config.animation.timeScale;

    this.animator.init(count, config.animation.states);

    this.syncAllToBack();
  }

  createMaterial(config) {
    const mat = new MeshBasicNodeMaterial();

    const lightDir = normalize(this.uLightDir);
    const nDotL = clamp(dot(normalView, lightDir), float(0), float(1));

    const t0 = clamp(nDotL.div(0.35), float(0), float(1));
    const t1 = clamp(nDotL.sub(0.1).div(0.35), float(0), float(1));
    const t2 = clamp(nDotL.sub(0.25).div(0.55), float(0), float(1));

    const ss0 = t0.mul(t0).mul(float(3).sub(t0.mul(2)));
    const ss1 = t1.mul(t1).mul(float(3).sub(t1.mul(2)));
    const ss2 = t2.mul(t2).mul(float(3).sub(t2.mul(2)));

    const b0 = mix(this.uAccent, this.uShadow, ss0);
    const b1 = mix(b0, this.uMidtone, ss1);
    const gradientColor = mix(b1, this.uHighlight, ss2);

    const chartBlend = clamp(attribute('chartBlend', 'float'), float(0), float(1));
    mat.colorNode = mix(gradientColor, this.uChartColor, chartBlend);

    mat.transparent = true;
    mat.opacity = config.particles.opacity;

    mat.blending = config.particles.blending === 'additive'
      ? AdditiveBlending
      : NormalBlending;

    return mat;
  }

  update(deltaMs, time) {
    this.animator.update(deltaMs);
    computeNoiseOffsets(this.animator.positions.length, this.config.forces, time);
    this.interaction.apply(
      this.animator.positions,
      this.velocities,
      this.config.interaction,
    );
  }

  classifyAndSync(camera, cutoff, enabled) {
    const { positions } = this.animator;
    const baseSize = this.config.particles.size;
    const variation = this.config.particles.sizeVariation;
    const viewMatrix = camera.matrixWorldInverse;
    const { chartMode } = this;

    let frontIdx = 0;
    let frontZSum = 0;

    const { screenAnchorMode } = this;
    const isAnchorActive = screenAnchorMode.active
      && (screenAnchorMode.phase === 'flying'
        || screenAnchorMode.phase === 'arrived'
        || screenAnchorMode.phase === 'expanding');

    if (isAnchorActive) {
      // Screen anchor mode: all particles stay in backMesh — never transferred to front canvas.
      for (let i = 0; i < screenAnchorMode.targets.length; i++) {
        const target = screenAnchorMode.targets[i];
        const tx = target.worldX + target.offsetX;
        const ty = target.worldY + target.offsetY;

        if (screenAnchorMode.phase === 'flying') {
          const rawT = Math.min(screenAnchorMode.elapsed / screenAnchorMode.flyDuration, 1);
          const stagger = screenAnchorMode.targets.length > 1
            ? i * (0.5 / (screenAnchorMode.targets.length - 1))
            : 0;
          const localT = Math.max(0, Math.min((rawT - stagger) / (1 - stagger), 1));
          const eased = localT < 0.5 ? 2 * localT * localT : 1 - (-2 * localT + 2) ** 2 / 2;

          const size = target.startSize + (target.dotSize - target.startSize) * eased;
          _scale.set(size, size, size);
          const mt = 1 - eased;
          _pos.set(
            mt * mt * target.startX + 2 * mt * eased * target.ctrlX + eased * eased * tx,
            mt * mt * target.startY + 2 * mt * eased * target.ctrlY + eased * eased * ty,
            mt * mt * target.startZ + 2 * mt * eased * target.ctrlZ + eased * eased * 0,
          );
        } else if (screenAnchorMode.phase === 'expanding') {
          const rawT = Math.min(screenAnchorMode.expandElapsed / screenAnchorMode.expandDuration, 1);
          const stagger = screenAnchorMode.targets.length > 1
            ? i * (0.3 / (screenAnchorMode.targets.length - 1))
            : 0;
          const localT = Math.max(0, Math.min((rawT - stagger) / (1 - stagger), 1));
          const eased = localT < 0.5 ? 2 * localT * localT : 1 - (-2 * localT + 2) ** 2 / 2;
          const s = target.dotSize + (target.startSize - target.dotSize) * eased;
          _scale.set(s, s, s);
          // Follow the animator — formation retransition is already running in parallel.
          const fi = target.particleIndex;
          _pos.copy(positions[fi]).add(getNoiseOffset(fi));
        } else {
          // arrived — screen-space oscillation baked into worldX/worldY by engine loop
          _scale.set(target.dotSize, target.dotSize, target.dotSize);
          _pos.set(tx, ty, 0);
        }

        this.backBlendArray[i] = 0;
        _matrix.makeScale(_scale.x, _scale.y, _scale.z);
        _matrix.setPosition(_pos);
        this.backMesh.setMatrixAt(i, _matrix);
      }

      this.backMesh.count = screenAnchorMode.targets.length;
      this.backMesh.instanceMatrix.needsUpdate = true;
      this.backBlendAttr.needsUpdate = true;
      this.frontMesh.count = 0;
      return;
    }

    // Normal mode: back mesh at formation positions, front mesh for depth layer or bar/bubble chart
    for (let i = 0; i < positions.length; i++) {
      this.backBlendArray[i] = 0;
      const t = Math.sin(i * 1.7) * 0.5 + 0.5;
      const s = baseSize * (1 + t * (variation - 1));
      _scale.set(s, s, s);
      _matrix.makeScale(_scale.x, _scale.y, _scale.z);

      _pos.copy(positions[i]).add(getNoiseOffset(i));
      _matrix.setPosition(_pos);

      this.backMesh.setMatrixAt(i, _matrix);

      if (enabled && !chartMode.active) {
        _viewPos.copy(_pos).applyMatrix4(viewMatrix);
        const dist = -_viewPos.z;
        if (dist < cutoff) {
          // eslint-disable-next-line no-underscore-dangle
          this._lastFrontIndices[frontIdx] = i;
          this.frontBlendArray[frontIdx] = 0;
          this.frontMesh.setMatrixAt(frontIdx, _matrix);
          frontZSum += dist;
          // eslint-disable-next-line no-plusplus
          frontIdx++;
        }
      }
    }

    // Front mesh carries bar/bubble chart particles when active
    if (chartMode.active) {
      const meshCapacity = positions.length;

      // First: render the frozen formation particles that
      // were in the depth layer when chart mode started
      // eslint-disable-next-line no-restricted-syntax
      for (const fi of chartMode.frozenFrontIndices) {
        if (frontIdx >= meshCapacity) break;
        const t = Math.sin(fi * 1.7) * 0.5 + 0.5;
        const s = baseSize * (1 + t * (variation - 1));
        _scale.set(s, s, s);
        _pos.copy(positions[fi]).add(getNoiseOffset(fi));
        _matrix.makeScale(_scale.x, _scale.y, _scale.z);
        _matrix.setPosition(_pos);
        this.frontBlendArray[frontIdx] = 0;
        this.frontMesh.setMatrixAt(frontIdx, _matrix);
        // eslint-disable-next-line no-plusplus
        frontIdx++;
      }

      // Then: chart particles flying to their targets
      for (let i = 0; i < chartMode.targets.length; i++) {
        if (frontIdx >= meshCapacity) break;
        const target = chartMode.targets[i];
        let blend = 0;
        const tx = target.worldX + target.offsetX;
        const ty = target.worldY + target.offsetY;

        if (chartMode.phase === 'hidden') {
          // eslint-disable-next-line no-continue
          continue;
        } else if (chartMode.phase === 'flying') {
          const rawT = Math.min(chartMode.elapsed / chartMode.flyDuration, 1);
          const stagger = chartMode.targets.length > 1 ? i * (0.5 / (chartMode.targets.length - 1)) : 0;
          const localT = Math.max(0, Math.min((rawT - stagger) / (1 - stagger), 1));
          const eased = localT < 0.5 ? 2 * localT * localT : 1 - (-2 * localT + 2) ** 2 / 2;
          const size = target.startSize + (target.dotSize - target.startSize) * eased;
          _scale.set(size, size, size);
          const mt = 1 - eased;
          _pos.set(
            mt * mt * target.startX + 2 * mt * eased * target.ctrlX + eased * eased * tx,
            mt * mt * target.startY + 2 * mt * eased * target.ctrlY + eased * eased * ty,
            mt * mt * target.startZ + 2 * mt * eased * target.ctrlZ + eased * eased * 0.5,
          );
          blend = eased;
        } else if (chartMode.phase === 'shrinking') {
          const shrinkT = Math.min(chartMode.shrinkElapsed / chartMode.shrinkDuration, 1);
          const size = target.dotSize * (1 - shrinkT);
          _scale.set(size, size, size);
          _pos.set(tx, ty, 0.5);
          blend = 1;
        } else {
          // arrived
          _scale.set(target.dotSize, target.dotSize, target.dotSize);
          // Stay precisely at the target — no oscillation for bar or bubble
          _pos.set(tx, ty, 0.5);
          blend = 1;
        }

        this.frontBlendArray[frontIdx] = blend;
        _matrix.makeScale(_scale.x, _scale.y, _scale.z);
        _matrix.setPosition(_pos);
        this.frontMesh.setMatrixAt(frontIdx, _matrix);
        frontIdx++;
      }
    }

    if (!chartMode.active) this._lastFrontIndices.length = frontIdx;
    this.backMesh.count = positions.length;
    this.frontMesh.count = frontIdx;
    this._frontAvgViewZ = frontIdx > 0 ? frontZSum / frontIdx : 0;
    this.backMesh.instanceMatrix.needsUpdate = true;
    this.backBlendAttr.needsUpdate = true;
    if (frontIdx > 0) {
      this.frontMesh.instanceMatrix.needsUpdate = true;
      this.frontBlendAttr.needsUpdate = true;
    }
  }

  syncAllToBack() {
    const { positions } = this.animator;
    const baseSize = this.config.particles.size;
    const variation = this.config.particles.sizeVariation;

    for (let i = 0; i < positions.length; i++) {
      const t = Math.sin(i * 1.7) * 0.5 + 0.5;
      const s = baseSize * (1 + t * (variation - 1));

      _scale.set(s, s, s);
      _matrix.makeScale(_scale.x, _scale.y, _scale.z);

      _pos.copy(positions[i]).add(getNoiseOffset(i));
      _matrix.setPosition(_pos);

      this.backMesh.setMatrixAt(i, _matrix);
    }

    this.backMesh.count = positions.length;
    this.frontMesh.count = 0;
    this.backMesh.instanceMatrix.needsUpdate = true;
  }

  rebuild(config) {
    const oldBack = this.backMesh;
    const oldFront = this.frontMesh;
    const { count } = config.particles;

    const geometry = new SphereGeometry(config.particles.size, 24, 16);

    this.backMesh = new InstancedMesh(geometry, this.material, count);
    this.backMesh.frustumCulled = false;

    this.frontMesh = new InstancedMesh(geometry.clone(), this.frontMaterial, count);
    this.frontMesh.frustumCulled = false;
    this.frontMesh.count = 0;

    this.backBlendArray = new Float32Array(count);
    this.frontBlendArray = new Float32Array(count);

    this.backBlendAttr = new InstancedBufferAttribute(this.backBlendArray, 1);
    this.frontBlendAttr = new InstancedBufferAttribute(this.frontBlendArray, 1);

    this.backMesh.geometry.setAttribute('chartBlend', this.backBlendAttr);
    this.frontMesh.geometry.setAttribute('chartBlend', this.frontBlendAttr);

    this.velocities = Array.from({ length: count }, () => new Vector3());

    this.animator.init(count, config.animation.states);

    this.syncAllToBack();

    oldBack.geometry.dispose();
    oldBack.removeFromParent();

    oldFront.geometry.dispose();
    oldFront.removeFromParent();
  }

  dispose() {
    this.backMesh?.geometry.dispose();
    this.frontMesh?.geometry.dispose();
    this.material.dispose();
    this.frontMaterial.dispose();
  }
}
/* eslint-enable */
