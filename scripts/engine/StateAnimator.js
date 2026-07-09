import { getFormationPositions } from './formations.js';

const easings = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - (1 - t) ** 3,
  easeInOut: (t) => (t < 0.5
    ? 4 * t * t * t
    : 1 - (-2 * t + 2) ** 3 / 2),
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    return 2 ** (-10 * t)
      * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  },
};

// eslint-disable-next-line import/prefer-default-export
export class StateAnimator {
  constructor() {
    this.currentPositions = [];
    this.startPositions = [];
    this.targetPositions = [];

    this.stateIndex = 0;
    this.prevIndex = 0;

    this.phase = 'holding';
    this.phaseTime = 0;
    this.direction = 1;

    this.formationCache = new Map();

    this.scrollMode = false;
    this.manualOnly = false;

    this.states = [];
    this.transitionDuration = 2000;
    this.easing = 'easeInOut';
    this.stagger = 0.3;
    this.holdDuration = 3000;
    this.loop = 'loop';
    this.timeScale = 1;

    this.activeDuration = this.transitionDuration;
  }

  get positions() {
    return this.currentPositions;
  }

  get currentStateName() {
    return this.states[this.stateIndex] ?? '';
  }

  get currentStepIndex() {
    return this.stateIndex;
  }

  get isTransitioning() {
    return this.phase === 'transitioning';
  }

  get globalProgress() {
    if (this.phase !== 'transitioning') return this.stateIndex;

    const lastStagger = (this.currentPositions.length > 1)
      ? ((this.currentPositions.length - 1)
        / this.currentPositions.length)
      * this.stagger * this.activeDuration
      : 0;

    const totalDuration = this.activeDuration + lastStagger;
    const linear = Math.min(this.phaseTime / totalDuration, 1);
    const fraction = easings.easeInOut(linear);

    return this.prevIndex
      + (this.stateIndex - this.prevIndex) * fraction;
  }

  goToNext() {
    if (this.phase === 'transitioning') return;
    if (this.manualOnly && this.stateIndex >= this.states.length - 1) return;

    const next = (this.stateIndex + 1) % this.states.length;
    this.transitionTo(next);
  }

  goToPrev() {
    if (this.phase === 'transitioning') return;
    if (this.manualOnly && this.stateIndex <= 0) return;

    const prev = (this.stateIndex - 1 + this.states.length)
      % this.states.length;
    this.transitionTo(prev);
  }

  goToStep(index) {
    if (index < 0 || index >= this.states.length) return;
    if (index === this.stateIndex) return;
    this.transitionTo(index);
  }

  retransitionTo(index) {
    if (index < 0 || index >= this.states.length) return;
    this.transitionTo(index);
  }

  transitionTo(index) {
    this.prevIndex = this.stateIndex;
    this.stateIndex = index;

    const isIntro = this.prevIndex === 0 && index === 1;
    this.activeDuration = isIntro
      ? this.transitionDuration * 2.5
      : this.transitionDuration;

    const count = this.currentPositions.length;

    this.startPositions = this.currentPositions.map((v) => v.clone());
    this.targetPositions = getFormationPositions(this.states[index], count);

    this.phase = 'transitioning';
    this.phaseTime = 0;
  }

  init(count, states) {
    this.states = states;
    this.stateIndex = 0;
    this.phase = 'holding';
    this.phaseTime = 0;
    this.direction = 1;
    this.formationCache.clear();

    const initial = getFormationPositions(states[0], count);

    this.currentPositions = initial.map((v) => v.clone());
    this.startPositions = initial.map((v) => v.clone());
    this.targetPositions = initial.map((v) => v.clone());

    this.buildCache(count);
  }

  buildCache(count) {
    this.formationCache.clear();

    // eslint-disable-next-line no-restricted-syntax
    for (const state of this.states) {
      const key = `${state}_${count}`;

      if (!this.formationCache.has(key)) {
        this.formationCache.set(
          key,
          getFormationPositions(state, count),
        );
      }
    }
  }

  getCachedFormation(state) {
    const count = this.currentPositions.length;
    const key = `${state}_${count}`;

    let cached = this.formationCache.get(key);

    if (!cached) {
      cached = getFormationPositions(state, count);
      this.formationCache.set(key, cached);
    }

    return cached;
  }

  setScrollProgress(stateIndex, t) {
    const count = this.currentPositions.length;
    if (count === 0) return;

    const clampedIndex = Math.max(
      0,
      Math.min(stateIndex, this.states.length - 2),
    );

    const fromState = this.states[clampedIndex];
    const toState = this.states[clampedIndex + 1];

    if (!fromState || !toState) return;

    const fromPositions = this.getCachedFormation(fromState);
    const toPositions = this.getCachedFormation(toState);

    const easeFn = easings[this.easing];
    const easedT = easeFn(Math.max(0, Math.min(1, t)));

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      const staggerOffset = (i / count) * this.stagger;

      const localT = Math.max(
        0,
        Math.min(1, (easedT - staggerOffset) / (1 - this.stagger)),
      );

      this.currentPositions[i].lerpVectors(
        fromPositions[i],
        toPositions[i],
        localT,
      );
    }

    this.stateIndex = t >= 1
      ? clampedIndex + 1
      : clampedIndex;
  }

  update(deltaMs) {
    if (this.scrollMode) return;

    const dt = deltaMs * this.timeScale;
    this.phaseTime += dt;

    if (this.phase === 'holding') {
      if (!this.manualOnly && this.phaseTime >= this.holdDuration) {
        this.startTransition();
      }
    } else {
      this.updateTransition();
    }
  }

  startTransition() {
    const nextIndex = this.getNextStateIndex();
    if (nextIndex === -1) return;

    this.stateIndex = nextIndex;

    const count = this.currentPositions.length;

    this.startPositions = this.currentPositions.map((v) => v.clone());
    this.targetPositions = getFormationPositions(
      this.states[this.stateIndex],
      count,
    );

    this.phase = 'transitioning';
    this.phaseTime = 0;
  }

  getNextStateIndex() {
    if (this.states.length <= 1) return -1;

    if (this.loop === 'pingPong') {
      const next = this.stateIndex + this.direction;

      if (next >= this.states.length || next < 0) {
        this.direction *= -1;
        return this.stateIndex + this.direction;
      }

      return next;
    }

    if (this.loop === 'loop') {
      return (this.stateIndex + 1) % this.states.length;
    }

    if (this.stateIndex + 1 < this.states.length) {
      return this.stateIndex + 1;
    }

    return -1;
  }

  updateTransition() {
    const count = this.currentPositions.length;
    const easeFn = easings[this.easing];
    const dur = this.activeDuration;

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      const staggerDelay = (i / count) * this.stagger * dur;
      const localTime = this.phaseTime - staggerDelay;

      const rawProgress = Math.max(
        0,
        Math.min(1, localTime / dur),
      );

      const t = easeFn(rawProgress);

      this.currentPositions[i].lerpVectors(
        this.startPositions[i],
        this.targetPositions[i],
        t,
      );
    }

    const lastParticleStagger = ((count - 1) / count)
      * this.stagger * dur;

    if (this.phaseTime >= dur + lastParticleStagger) {
      this.phase = 'holding';
      this.phaseTime = 0;
    }
  }
}
