function requestIdleCallbackShim(callback) {
  return setTimeout(() => {
    const start = Date.now()
    callback({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, 50 - (Date.now() - start))
      }
    })
  }, 1)
}

function cancelIdleCallbackShim(callback) {
  return setTimeout(() => {
    const start = Date.now()
    callback({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, 50 - (Date.now() - start))
      }
    })
  }, 1)
}

const win: any = window
export const requestIdleCallback = win.requestIdleCallback || requestIdleCallbackShim
export const cancelIdleCallback = win.cancelIdleCallback || cancelIdleCallbackShim
