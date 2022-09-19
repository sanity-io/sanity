/**
 * Simple requestIdleCallback polyfill
 * Can be removed when all browsers support requestIdleCallback: https://caniuse.com/requestidlecallback
 * @param callback
 * @param options
 */
const requestIdleCallbackShim: typeof window.requestIdleCallback = function requestIdleCallbackShim(
  callback,
  options?
): number {
  const start = Date.now()
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, Date.now() - start)
      },
    })
  }, 0)
}

const cancelIdleCallbackShim: typeof window.cancelIdleCallback = function cancelIdleCallbackShim(
  handle: number
): void {
  return window.clearTimeout(handle)
}

export const requestIdleCallback = window.requestIdleCallback || requestIdleCallbackShim
export const cancelIdleCallback = window.cancelIdleCallback || cancelIdleCallbackShim
