interface IdleDeadline {
  didTimeout: boolean
  timeRemaining: () => DOMHighResTimeStamp
}

interface IdleOptions {
  timeout: number
}

type IdleCallback = (deadline: IdleDeadline) => void

const win: Window & {
  requestIdleCallback?: (callback: IdleCallback, options?: IdleOptions) => number
  cancelIdleCallback?: (handle: number) => void
} = window

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function requestIdleCallbackShim(callback: IdleCallback, options?: IdleOptions): number {
  const start = Date.now()
  return win.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, Date.now() - start)
      },
    })
  }, 1)
}

function cancelIdleCallbackShim(handle: number): void {
  return win.clearTimeout(handle)
}

export const requestIdleCallback = win.requestIdleCallback || requestIdleCallbackShim
export const cancelIdleCallback = win.cancelIdleCallback || cancelIdleCallbackShim
