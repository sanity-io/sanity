import Observable from '@sanity/observable'

// Takes a observable returning function and returns a debounced function that
// collects arguments until wait time has passed without receiving new calls.
// When wait period is over, calls the original function with the collected arguments

export default function debounceCollect(fn, wait) {
  let timer
  let pendingArgs = []
  let observers = []
  return function (...args) {
    const observable = new Observable(obs => {
      const index = pendingArgs.push(args) - 1
      observers[index] = obs
      return () => {
        observers[index] = null
      }
    })

    clearTimeout(timer)
    timer = setTimeout(flush, wait)
    return observable
  }

  function flush() {
    const _args = pendingArgs
    const _observers = observers
    pendingArgs = []
    observers = []

    const observerCount = _observers.reduce((len, observer) => (observer ? len + 1 : len), 0)
    if (observerCount === 0) {
      return
    }
    fn(_args).subscribe(results => {
      results.forEach((result, i) => {
        if (_observers[i]) {
          _observers[i].next(results[i])
        }
      })
    })
  }
}
