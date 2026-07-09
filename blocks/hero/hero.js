// blocks/hero/hero.js
// Minimal hero EDS (XWalk + UE).
// - Add rds-headline-01 to title (h1/h2).
// - Add .hero-media y .hero-copy to css personalization.

// eslint-disable-next-line import/named
import { ensureWrapper } from '../../scripts/aem.js';

export default function decorate(block) {
  const inner = block.querySelector(':scope > div');
  const rows = inner ? [...inner.children] : [];
  const mediaCol = rows.find((c) => c.querySelector('picture, img'));
  const copyCol = rows.find((c) => c !== mediaCol);

  if (mediaCol) ensureWrapper(mediaCol, 'hero-media');
  if (copyCol) ensureWrapper(copyCol, 'hero-copy');

  const title = block.querySelector('h1, h2, [data-hero-title]');
  if (title) title.classList.add('rds-headline-01');

  requestAnimationFrame(() => block.classList.add('is-loaded'));
}
