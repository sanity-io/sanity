// Headless Chromium opens an idle period only after it has produced a frame.
// On a page with nothing to repaint — an expanded selection in the editor has
// no blinking caret — `requestIdleCallback` does not fire at all until some
// unrelated repaint comes along. `@sanity/validation` runs every check behind
// it, so `TestForm`'s document validation could stall for the rest of a test
// and then land, markers and re-render included, on whatever repaint came
// next: a pointer move, a hover, or nothing before the Chromatic archive.
// WebKit has no `requestIdleCallback` and jsdom neither, so those already take
// the timer path this makes uniform across browsers. Registered as the first
// `setupFiles` entry in `vitest.browser.config.mts` so that it runs before any
// module can capture the native function (`@sanity/validation` binds it at
// import time).
const IDLE_BUDGET_MS = 16

window.requestIdleCallback = (callback) =>
  window.setTimeout(() => {
    const start = performance.now()
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, IDLE_BUDGET_MS - (performance.now() - start)),
    })
  }, 0)

window.cancelIdleCallback = (handle) => window.clearTimeout(handle)
