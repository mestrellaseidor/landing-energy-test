/* eslint-disable */

function splitTextByWidth(text, maxWidth, font) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function applySplit(el) {
  const text = el.dataset.text;
  const style = getComputedStyle(el);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const maxWidth = el.clientWidth || window.innerWidth * 0.8;
  const lines = splitTextByWidth(text, maxWidth, font);
  el.innerHTML = lines.map((line) => `<span class="text-line">${line}</span>`).join('');
}

function parseBlock(block) {
  const row = block.querySelectorAll(':scope > div');
  if (row.length === 0) return [];
  return [...row].map((cell) => cell.textContent.trim()).filter(Boolean);
}

function buildDOM(block, texts) {
  const container = document.createElement('div');
  container.className = 'text-overlay-inner';

  const entries = texts.map((text) => {
    const el = document.createElement('div');
    el.className = 'text-entry rds-headline-01 anim-zoom-in-start';
    el.dataset.text = text;
    container.appendChild(el);
    return el;
  });

  block.innerHTML = '';
  block.appendChild(container);
  return entries;
}

class TextOverlayController {
  constructor(entries) {
    this.entries = entries;
    this.currentIndex = -1;
  }

  goToSlide(index) {
    if (index === this.currentIndex) return;

    const prev = this.entries[this.currentIndex];
    const next = this.entries[index];

    // Saca el anterior
    if (prev) {
      prev.classList.remove('anim-visible');
      prev.classList.add('anim-zoom-out-start');
    }

    // Mete el siguiente
    if (next) {
      next.classList.remove('anim-zoom-out-start');
      next.classList.add('anim-zoom-in-start');
      next.offsetHeight; // reflow
      requestAnimationFrame(() => {
        next.classList.remove('anim-zoom-in-start');
        next.classList.add('anim-visible');
      });
    }

    this.currentIndex = index;
  }
}

export default function decorate(block) {
  const texts = parseBlock(block);
  const entries = buildDOM(block, texts);

  requestAnimationFrame(() => {
    entries.forEach(applySplit);
    const controller = new TextOverlayController(entries);
    controller.goToSlide(0);

    document.addEventListener('story:slide', (e) => {
      controller.goToSlide(e.detail.slide);
    });
  });
}
/* eslint-enable */
