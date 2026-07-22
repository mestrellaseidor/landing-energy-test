import { getMetadata } from './aem.js';

/**
 * Adds a <meta name="..."> tag to <head> if a value is provided
 * and no meta with the same name already exists (editor values win).
 * @param {string} name The meta name
 * @param {string} content The meta content
 */
function setMeta(name, content) {
  if (!content) return;
  if (document.head.querySelector(`meta[name="${name}"]`)) return;
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/**
 * Derives <meta name="date"> and <meta name="dateModified"> from the
 * EDS-managed <meta name="published-time"> and <meta name="modified-time">.
 * Safe to call before the rest of the decoration pipeline runs.
 */
export default function syncDateMeta() {
  setMeta('date', getMetadata('published-time'));
  setMeta('dateModified', getMetadata('modified-time'));
}
