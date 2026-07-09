import { ParticleEngine } from '../../scripts/engine/ParticleEngine.js';
import { buildStepOffsets, extractFormations } from '../../scripts/config/stepLoader.js';
import { defaultConfig } from '../../scripts/config/defaults.js';
import { stepsJSON } from '../../scripts/config/steps-object.js';

class ParticlesController {
  constructor() {
    this.engine = null;

    this.state = {
      steps: [],
      currentStep: 0,
      transitioning: false,
    };

    this.refs = {
      canvas: null,
      frontCanvas: null,
    };
  }

  async collectBlocks(overlays) {
    const mainElement = document.querySelector('main');
    const mainSection = mainElement.querySelector('div.section');
    const blocks = mainSection.querySelectorAll(':scope > div');
    const blockNames = [];

    blocks.forEach((blockItem) => {
      if (blockItem.classList.contains('particles-wrapper')) return;
      overlays.appendChild(blockItem);
      const wrapperClass = [...blockItem.classList].find((c) => c.endsWith('-wrapper'));
      if (wrapperClass) blockNames.push(wrapperClass.slice(0, -8)); // strip '-wrapper'
    });

    const base = window.hlx?.codeBasePath ?? '';
    const configs = await Promise.all(
      blockNames.map(async (name) => {
        try {
          const mod = await import(`${base}/blocks/${name}/${name}.js`);
          return [name, mod.particlesConfig ?? null];
        } catch {
          return [name, null];
        }
      }),
    );

    this.blockConfigs = Object.fromEntries(configs);
  }

  createDOM(block) {
    const slides = document.createElement('div');
    slides.className = 'slides';

    const interactionLayer = document.createElement('div');
    interactionLayer.className = 'interaction-layer';
    this.refs.interactionLayer = interactionLayer;

    const bg = document.createElement('div');
    bg.className = 'bg-gradient';

    const bgCustom = document.createElement('div');
    bgCustom.className = 'bg-custom';

    const overlays = document.createElement('div');
    overlays.className = 'overlay-components-wrapper';

    const canvas = document.createElement('canvas');
    canvas.className = 'viewport';

    const frontCanvas = document.createElement('canvas');
    frontCanvas.className = 'front-viewport';

    const scrollButton = document.createElement('button');
    scrollButton.className = 'chevron';

    slides.append(interactionLayer, bg, bgCustom, overlays, canvas, frontCanvas, scrollButton);
    block.appendChild(slides);

    this.refs.overlays = overlays;
    this.refs.canvas = canvas;
    this.refs.frontCanvas = frontCanvas;
  }

  bindEngineEvents() {
    this.engine.setOnStepChange(({ step }) => {
      this.state.currentSlide = step;

      document.dispatchEvent(
        new CustomEvent('story:slide', {
          detail: { slide: step },
        }),
      );

      const stepIndex = this.stepOffsets.findLastIndex((offset) => offset <= step);

      if (stepIndex !== this.state.currentStep) {
        this.state.currentStep = stepIndex;
        document.dispatchEvent(
          new CustomEvent('story:step', {
            detail: { step: stepIndex },
          }),
        );
      }
    });

    this.engine.setOnTransitionEnd(() => {
      this.state.transitioning = false;
      document.dispatchEvent(
        new CustomEvent('story:transitioning', { detail: { state: false } }),
      );
    });
  }

  navigateTo(target) {
    if (!this.engine) return;
    if (this.state.transitioning) return;

    this.state.transitioning = true;

    document.dispatchEvent(
      new CustomEvent('story:transitioning', {
        detail: { state: true },
      }),
    );

    this.engine.goToStep(target);

    // eslint-disable-next-line no-underscore-dangle
    clearTimeout(this._transitionFallback);
    // eslint-disable-next-line no-underscore-dangle
    this._transitionFallback = setTimeout(() => {
      this.state.transitioning = false;
    }, 4000);
  }

  next() {
    if (!this.engine) return;
    if (this.state.transitioning) return;

    this.state.transitioning = true;

    document.dispatchEvent(
      new CustomEvent('story:transitioning', {
        detail: { state: true },
      }),
    );

    this.engine.nextState();

    // eslint-disable-next-line no-underscore-dangle
    clearTimeout(this._transitionFallback);
    // eslint-disable-next-line no-underscore-dangle
    this._transitionFallback = setTimeout(() => {
      this.state.transitioning = false;
    }, 4000);
  }

  prev() {
    if (!this.engine) return;
    if (this.state.transitioning) return;

    this.state.transitioning = true;

    document.dispatchEvent(
      new CustomEvent('story:transitioning', {
        detail: { state: true },
      }),
    );

    this.engine.prevState();

    // eslint-disable-next-line no-underscore-dangle
    clearTimeout(this._transitionFallback);
    // eslint-disable-next-line no-underscore-dangle
    this._transitionFallback = setTimeout(() => {
      this.state.transitioning = false;
    }, 4000);
  }

  bindUIEvents() {
    document.addEventListener('story:navigate', (e) => {
      this.navigateTo(e.detail.step);
    });

    document.addEventListener('story:next', () => {
      this.next();
    });

    document.addEventListener('story:prev', () => {
      this.prev();
    });
  }

  getInitialStepFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return 0;

    const idx = this.state.steps.findIndex((s) => s.anchor === hash);
    return idx >= 0 ? idx : 0;
  }

  initStep() {
    const start = this.getInitialStepFromHash();

    if (start > 0) {
      this.engine.nextState();
    } else {
      this.engine.goToStep(start);
    }
  }

  async init(block) {
    this.createDOM(block);
    await this.collectBlocks(this.refs.overlays);

    this.state.steps = stepsJSON;
    this.stepOffsets = buildStepOffsets(this.state.steps);
    const formations = extractFormations(this.state.steps);

    this.engine = new ParticleEngine();

    await this.engine.init(
      this.refs.interactionLayer,
      this.refs.canvas,
      this.refs.frontCanvas,
      structuredClone(defaultConfig),
      formations,
    );

    this.bindEngineEvents();
    this.bindUIEvents();

    setTimeout(() => this.initStep(), 300);
  }
}

export default function decorate(block) {
  const particles = new ParticlesController();
  particles.init(block).then(() => {
    // eslint-disable-next-line no-underscore-dangle
    window._pc = particles;
  });
}
