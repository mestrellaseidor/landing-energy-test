/* eslint-disable */
import { ParticleSystem } from './ParticleSystem.js';
import { CameraRig } from './CameraRig.js';
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  RenderPipeline,
  WebGPURenderer
} from '../libs/three/three.webgpu.js';
import { OrthographicCamera, Scene } from '../libs/three/three.core.js';
import { pass, uniform } from '../libs/three/three.tsl.js';

export class ParticleEngine {
  constructor() {
    this.renderer = null;
    this.frontRenderer = null;

    this.scene = new Scene();
    this.frontScene = new Scene();

    this.cameraRig = null;
    this.particleSystem = new ParticleSystem();

    this.lastTime = 0;
    this.elapsed = 0;
    this.animationId = 0;

    this.config = null;
    this.canvas = null;
    this.frontCanvas = null;

    this.pipeline = null;
    this.wheelHandler = null;

    this._onStepChange = null;
    this._onTransitionEnd = null;
    this._lastReportedStep = -1;
    this._wasTransitioning = false;

    this.mokaModel = null;
    this.mokaOpacity = 0;
    this.mokaBaseY = 0;
    this.mokaExitY = 0;

    this._onChartDotsReady = null;

    this._mokaAmbient = null;
    this._mokaKey = null;
    this._mokaFill = null;
    this._mokaRim = null;

    this.frontCamera = null;
    this._axesHelper = null;

    this._pendingAnchorFormationTargetIndex = -1;

    this.mokaLighting = {
      ambientColor: '#FFF8F0',
      ambientIntensity: 0.4,
      keyColor: '#FFF5E8',
      keyIntensity: 0.45,
      fillColor: '#ffffff',
      fillIntensity: 0.4,
      rimColor: '#FFF8F0',
      rimIntensity: 0.0,
    };

    this.uFocusDistance = uniform(10);
    this.uFocalLength = uniform(5);
    this.uBokehScale = uniform(4);
  }

  enableStepMode() {
    const animator = this.particleSystem.animator;
    animator.manualOnly = true;
    this.cameraRig.setScrollMode(true);

    this.wheelHandler = (e) => {
      const target = e.target;
      if (target.closest('.gui')) return;
      if (target.closest('.inner-modal-body')) return;

      e.preventDefault();
      if (animator.isTransitioning) return;

      if (e.deltaY > 0) {
        document.dispatchEvent(new CustomEvent('story:next'));
      } else if (e.deltaY < 0) {
        document.dispatchEvent(new CustomEvent('story:prev'));
      }
    };

    window.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  async init(interactionRef, canvas, frontCanvas, config, formations) {
    await new Promise((r) => requestAnimationFrame(r));
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.canvas = canvas;
    this.frontCanvas = frontCanvas;
    this.config = config;
    this.renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    await this.renderer.init();
    this.renderer.setClearColor(0x000000, 0);
    this.frontRenderer = new WebGPURenderer({
      canvas: frontCanvas,
      antialias: true,
      alpha: true,
    });
    this.frontRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.frontRenderer.setSize(width, height, false);
    await this.frontRenderer.init();
    this.frontRenderer.setClearColor(0x000000, 0);

    const fw = frontCanvas.clientWidth;
    const fh = frontCanvas.clientHeight;

    this.frontCamera = new OrthographicCamera(-fw / 2, fw / 2, fh / 2, -fh / 2, 0.1, 100);
    this.frontCamera.position.z = 50;

    this.scene.background = null;

    const ambient = new AmbientLight(0xffffff, 1.8);
    const keyLight = new DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(4, 6, 5);

    const fillLight = new DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-4, 2, -3);

    const rimLight = new DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, -2, -6);

    this.scene.add(ambient, keyLight, fillLight, rimLight);

    this._mokaAmbient = new AmbientLight(0xfff8f0, 0.7);
    this._mokaAmbient.layers.set(1);

    this._mokaKey = new DirectionalLight(0xfff5e8, 0.6);
    this._mokaKey.position.set(4, 6, 5);
    this._mokaKey.layers.set(1);

    this._mokaFill = new DirectionalLight(0xfff0e0, 0.4);
    this._mokaFill.position.set(-4, 2, -3);
    this._mokaFill.layers.set(1);

    this._mokaRim = new DirectionalLight(0xfff8f0, 0.0);
    this._mokaRim.position.set(0, -2, -6);
    this._mokaRim.layers.set(1);

    this.scene.add(
      this._mokaAmbient,
      this._mokaKey,
      this._mokaFill,
      this._mokaRim,
    );

    const frontAmbient = new AmbientLight(0xffffff, 0.4);
    const frontDirectional = new DirectionalLight(0xffffff, 0.8);
    frontDirectional.position.set(5, 10, 7);

    this.frontScene.add(frontAmbient, frontDirectional);

    this._axesHelper = new AxesHelper(5);
    this._axesHelper.visible = false;
    this.scene.add(this._axesHelper);

    this.cameraRig = new CameraRig(canvas.clientWidth / canvas.clientHeight);
    this.cameraRig.applyConfig(config.camera);
    this.cameraRig.camera.layers.enable(1);

    if (formations) {
      config.animation.states = formations;
    }

    this.particleSystem.init(config);
    this.scene.add(this.particleSystem.backMesh);
    this.frontScene.add(this.particleSystem.frontMesh);

    this.setupPostProcessing(config);
    this.enableStepMode();

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('resize', this.onResize);

    this.loop();
  }

  playIntro() {
    this.particleSystem.animator.goToNext();
  }

  applyDofConfig(dof) {
    if (dof.enabled) {
      this.uFocusDistance.value = dof.focusDistance;
      this.uFocalLength.value = dof.focalLength;
      this.uBokehScale.value = dof.bokehScale;
    } else {
      this.uBokehScale.value = 0;
    }
  }

  setupPostProcessing(config) {
    this.pipeline = new RenderPipeline(this.renderer);

    this.pipeline.outputNode = pass(this.scene, this.cameraRig.camera);

    this.applyDofConfig(config.camera.depthOfField);
  }

  setOnStepChange(cb) {
    // eslint-disable-next-line no-underscore-dangle
    this._onStepChange = cb;
  }

  setOnTransitionEnd(cb) {
    // eslint-disable-next-line no-underscore-dangle
    this._onTransitionEnd = cb;
  }

  setOnChartDotsReady(cb) {
    // eslint-disable-next-line no-underscore-dangle
    this._onChartDotsReady = cb;
  }

  getCurrentStepIndex() {
    return this.particleSystem.animator.currentStepIndex;
  }

  getIsTransitioning() {
    return this.particleSystem.animator.isTransitioning;
  }

  goToStep(index) {
    this.particleSystem.animator.goToStep(index);
  }

  nextState() {
    this.particleSystem.animator.goToNext();
  }

  prevState() {
    this.particleSystem.animator.goToPrev();
  }

  applyFrontCanvasBlur() {
    const dofCfg = this.config.camera.depthOfField
    if (!dofCfg.enabled) {
      this.frontCanvas.style.filter = "";
      return;
    }

    const avgZ = this.particleSystem.frontAvgViewZ;
    if (avgZ <= 0) {
      this.frontCanvas.style.filter = "";
      return;
    }

    const { focusDistance, focalLength, bokehScale } = dofCfg;
    const coc = Math.abs(
      (bokehScale * focalLength * (focusDistance - avgZ)) / (avgZ * (focusDistance - focalLength))
    );
    const blurPx = Math.min(coc * 0.8, 12);
    this.frontCanvas.style.filter = blurPx > 0.3 ? `blur(${blurPx.toFixed(1)}px)` : "";
  }

  loop = () => {
    this.animationId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const delta = this.lastTime ? now - this.lastTime : 16;

    this.lastTime = now;
    this.elapsed += delta / 1000;

    this.particleSystem.update(delta, this.elapsed);
    this.cameraRig.update(delta);

    this.particleSystem.classifyAndSync(
      this.cameraRig.camera,
      this.config?.depthLayers?.frontCutoff ?? 10,
      this.config?.depthLayers?.enabled ?? true
    );

    const stepIdx = this.particleSystem.animator.currentStepIndex;

    if (stepIdx !== this._lastReportedStep) {
      this._lastReportedStep = stepIdx;
      if (this._onStepChange) {
        this._onStepChange({ step: stepIdx });
      }
    }

    const animating = this.particleSystem.animator.isTransitioning;

    if (this._wasTransitioning && !animating) {
      if (this._onTransitionEnd) this._onTransitionEnd();
    }

    this._wasTransitioning = animating;

    const progress = this.particleSystem.animator.globalProgress;
    document.documentElement.style.setProperty('--scroll-progress', String(progress));

    this.renderer.render(this.scene, this.cameraRig.camera);

    if (this.particleSystem.frontMesh.count > 0) {
      this.frontRenderer.render(this.frontScene, this.cameraRig.camera)
      if (this.particleSystem.chartMode.active) {
        this.frontCanvas.style.filter = "";
      } else {
        this.applyFrontCanvasBlur();
      }
    } else {
      this.frontRenderer.clear();
      this.frontCanvas.style.filter = "";
    }
  }

  onMouseMove = (e) => {
    this.particleSystem.interaction.updateMouse(e, this.cameraRig.camera, this.canvas);
  }

  onMouseLeave = () => {
    this.particleSystem.interaction.deactivate();
  }

  onResize = () => {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.renderer.setSize(w, h, false);
    this.frontRenderer.setSize(w, h, false);
    this.cameraRig.resize(w / h);

    this.frontCamera.left = -w / 2;
    this.frontCamera.right = w / 2;
    this.frontCamera.top = h / 2;
    this.frontCamera.bottom = -h / 2;
    this.frontCamera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.animationId);

    if (this.wheelHandler) {
      window.removeEventListener('wheel', this.wheelHandler);
    }

    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('resize', this.onResize);

    this.particleSystem.dispose();
    this.cameraRig.dispose();
    this.renderer.dispose();
    this.frontRenderer.dispose();
  }
}
/* eslint-enable */
