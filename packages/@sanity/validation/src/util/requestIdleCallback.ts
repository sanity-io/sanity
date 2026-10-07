/**
 * The longest idle period browsers hand out (the spec's cap when no frame is pending), which the
 * shim reports as the budget of each callback so that callers that pace themselves on
 * `timeRemaining()` yield at the same rate as in a browser.
 */
const SHIM_IDLE_PERIOD_MS = 50

/**
 * Simple requestIdleCallback polyfill
 * Can be removed when all browsers support requestIdleCallback: https://caniuse.com/requestidlecallback
 * @param callback -
 * @param options -
 */
const requestIdleCallbackShim: typeof window.requestIdleCallback = function requestIdleCallbackShim(
  callback,
  _options?,
): number {
  return globalThis.setTimeout(() => {
    const start = Date.now()
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, SHIM_IDLE_PERIOD_MS - (Date.now() - start))
      },
    })
  }, 0) as unknown as number
}

const cancelIdleCallbackShim: typeof window.cancelIdleCallback = function cancelIdleCallbackShim(
  handle: number,
): void {
  return globalThis.clearTimeout(handle)
}

const win = typeof window === 'undefined' ? undefined : window

export const requestIdleCallback = win?.requestIdleCallback || requestIdleCallbackShim
export const cancelIdleCallback = win?.cancelIdleCallback || cancelIdleCallbackShim
