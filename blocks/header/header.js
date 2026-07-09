import decorateStepNav from './step-nav.js';
import { stepsJSON } from '../../scripts/config/steps-object.js';

function parseConfig(block) {
  const rows = [...block.children];
  const title = rows[0]?.textContent?.trim() || 'Energy';

  return {
    title,
    homeUrl: '/',
    steps: stepsJSON,
  };
}

async function createHeader(config) {
  const header = document.createElement('header');
  header.className = 'app-header';

  // LEFT → TITLE
  const title = document.createElement('a');
  title.className = 'title';
  title.href = config.homeUrl;
  title.textContent = config.title;

  // CENTER → STEP NAV
  const stepNav = document.createElement('div');
  stepNav.className = 'step-nav-container';

  // RIGHT → LOGO
  const logoResp = await fetch('/nav.plain.html');
  const logo = document.createElement('div');
  logo.innerHTML = await logoResp.text();
  const imageItem = logo.querySelector('img');
  imageItem.className = 'logo';

  logo.addEventListener('click', () => {
    window.location.href = config.homeUrl;
  });

  header.append(title, stepNav, logo);

  return {
    header,
    stepNav,
  };
}

function initHeaderHeight(header) {
  let observer = null;

  function update(el) {
    document.documentElement.style.setProperty(
      '--header-height',
      `${el.getBoundingClientRect().height}px`,
    );
  }

  if (!header) return;

  update(header);
  observer = new ResizeObserver(() => update(header));
  observer.observe(header);

  // eslint-disable-next-line consistent-return
  return () => {
    observer?.disconnect();
    observer = null;
  };
}

export default async function decorate(block) {
  const config = parseConfig(block);

  const {
    header,
    stepNav,
  } = await createHeader(config);

  block.innerHTML = '';
  block.appendChild(header);

  const fakeBlock = document.createElement('div');
  fakeBlock.dataset.stepCount = config.steps.length.toString();
  fakeBlock.dataset.steps = JSON.stringify(config.steps);

  decorateStepNav(fakeBlock);

  stepNav.appendChild(fakeBlock);

  initHeaderHeight(fakeBlock);
}
