import Observable from './SanityStoreObservable'

export default function timer(initialDelay, period) {
  return new Observable(observer => {
    let n = 0
    let intervalId = -1

    const timeoutId = setTimeout(() => {
      next()
      if (period !== undefined) {
        intervalId = setInterval(next, interval)
      }
    }, initialDelay)

    function next() {
      observer.next(n++)
    }
    return function dispose() {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  })
}
