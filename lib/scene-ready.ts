/**
 * The preloader lives in the root layout and the Spline scene lives deep inside
 * the page, so a module-level signal beats threading a provider between them
 * for one boolean that only ever flips once.
 */
let isReady = false;
const listeners = new Set<() => void>();

export function markSceneReady() {
  if (isReady) {
    return;
  }

  isReady = true;

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSceneReady(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function isSceneReady() {
  return isReady;
}
