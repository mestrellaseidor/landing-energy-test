export function extractFormations(steps) {
  return steps.flatMap((s) => s.slides.map((sl) => sl.formation));
}

export function buildSlideMap(steps) {
  // eslint-disable-next-line max-len
  return steps.flatMap((step, stepIndex) => step.slides.map((_, slideIndex) => ({ stepIndex, slideIndex })));
}

export function buildStepOffsets(steps) {
  const offsets = [];
  let offset = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const step of steps) {
    offsets.push(offset);
    offset += step.slides.length;
  }
  return offsets;
}
