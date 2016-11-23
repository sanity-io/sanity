import Observable from '@sanity/observable'

export default function observableTimer(initialDelay, period) {
  return new Observable(observer => {
    let n = 0
    let intervalId = -1

    const timeoutId = setTimeout(() => {
      emitNext()
      if (period !== undefined) {
        intervalId = setInterval(emitNext, period)
      }
    }, initialDelay)

    function emitNext() {
      observer.next(n++)
    }
    return function dispose() {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  })
}
