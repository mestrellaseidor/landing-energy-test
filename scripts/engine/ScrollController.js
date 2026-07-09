export class ScrollController {
  constructor(animator) {
    this.animator = animator;
    this.numStates = animator.states.length;
    this.ticking = false;

    this.onScroll = () => {
      if (!this.ticking) {
        this.ticking = true;
        requestAnimationFrame(() => {
          this.sync();
          this.ticking = false;
        });
      }
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.sync();
  }

  sync() {
    const { scrollY } = window;
    const sectionHeight = window.innerHeight * 3;

    if (this.numStates <= 1) {
      this.animator.setScrollProgress(0, 0);
      return;
    }

    const globalProgress = Math.min(scrollY / sectionHeight, this.numStates - 1);
    const stateIndex = Math.min(Math.floor(globalProgress), this.numStates - 2);
    const t = globalProgress - stateIndex;

    this.animator.setScrollProgress(stateIndex, Math.min(t, 1));
  }

  updateStateCount(count) {
    this.numStates = count;
  }

  dispose() {
    window.removeEventListener('scroll', this.onScroll);
  }
}
