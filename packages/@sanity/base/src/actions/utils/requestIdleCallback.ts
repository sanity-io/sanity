interface IdleDeadline {
  didTimeout: boolean
  timeRemaining: () => DOMHighResTimeStamp
}

interface IdleOptions {
  timeout: number
}

type IdleCallback = (deadline: IdleDeadline) => void

function requestIdleCallbackShim(callback: IdleCallback, _options?: IdleOptions): number {
  const start = Date.now()
  return (setTimeout as Window['setTimeout'])(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, Date.now() - start)
      },
    })
  }, 1)
}

function cancelIdleCallbackShim(handle: number): void {
  return clearTimeout(handle)
}

export const requestIdleCallback =
  typeof window === 'undefined' ? requestIdleCallbackShim : window.requestIdleCallback
export const cancelIdleCallback =
  typeof window === 'undefined' ? cancelIdleCallbackShim : window.cancelIdleCallback
