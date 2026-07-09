function parseConfig(block) {
  const steps = JSON.parse(block.dataset.steps || '[]');

  return {
    steps,
    currentStep: 0,
    transitioning: false,
  };
}

function createNav({ steps }) {
  const nav = document.createElement('nav');
  nav.className = 'step-nav';

  steps.forEach((step, i) => {
    const btn = document.createElement('button');
    btn.className = 'step-nav-item';
    btn.dataset.step = i.toString();
    btn.textContent = step.title;

    nav.appendChild(btn);
  });

  return nav;
}

function updateActive(nav, currentStep) {
  const items = nav.querySelectorAll('.step-nav-item');

  items.forEach((item, i) => {
    item.classList.toggle('active', i === currentStep);
  });
}

function setTransitioning(nav, state) {
  const items = nav.querySelectorAll('.step-nav-item');

  items.forEach((item) => {
    item.classList.toggle('disabled', state);
  });
}

function goToStep(stepIndex, steps) {
  const step = steps[stepIndex];
  if (step?.anchor) {
    window.history.replaceState({}, '', `#${step.anchor}`);
  }
}

function bindEvents(nav, model) {
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-nav-item');
    if (!btn) return;

    const step = parseInt(btn.dataset.step, 10);

    if (model.transitioning || step === model.currentStep) return;

    updateActive(nav, step);

    document.dispatchEvent(
      new CustomEvent('story:navigate', { detail: { step } }),
    );
  });

  document.addEventListener('story:step-change', (e) => {
    model.currentStep = e.detail.step;
    updateActive(nav, model.currentStep);
    goToStep(model.currentStep, model.steps);
  });

  document.addEventListener('story:transitioning', (e) => {
    model.transitioning = e.detail.state;
    setTransitioning(nav, model.transitioning);
  });
}

export default function decorateStepNav(block) {
  const model = parseConfig(block);
  const nav = createNav(model);

  bindEvents(nav, model);
  updateActive(nav, 0);

  block.innerHTML = '';
  block.appendChild(nav);
  block.setStep = (step) => updateActive(nav, step);
  block.setTransitioning = (state) => setTransitioning(nav, state);
}
