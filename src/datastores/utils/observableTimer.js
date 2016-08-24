import Observable from './SanityStoreObservable'

export default function timer(initialWait, interval) {
  return new Observable(observer => {
    let n = 0
    let intervalId = -1

    const timeoutId = setTimeout(() => {
      next()
      if (interval !== undefined) {
        intervalId = setInterval(next, interval)
      }
    }, initialWait)

    function next() {
      observer.next(n++)
    }
    return function dispose() {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  })
}
