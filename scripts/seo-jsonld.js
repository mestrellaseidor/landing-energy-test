import { getMetadata } from './aem.js';

/**
 * Adds datePublished and dateModified to the first JSON-LD <script> in <head>,
 * sourcing the values from EDS-rendered <meta name="published-time"> and
 * <meta name="modified-time">. Preserves all other properties.
 *
 * No-op if either:
 *   - No JSON-LD <script> is found
 *   - No date meta is present
 *   - The JSON-LD cannot be parsed
 */
export default function injectDatesIntoJsonLd() {
  const datePublished = getMetadata('published-time');
  const dateModified = getMetadata('modified-time');
  if (!datePublished && !dateModified) return;

  const script = document.head.querySelector('script[type="application/ld+json"]');
  if (!script) return;

  let data;
  try {
    data = JSON.parse(script.textContent);
  } catch {
    return; // don't touch a malformed JSON-LD
  }

  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;

  script.textContent = JSON.stringify(data, null, 2);
}
