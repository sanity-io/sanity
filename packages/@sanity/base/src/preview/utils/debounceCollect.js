import Observable from '@sanity/observable'

// Takes a observable returning function and returns a debounced function that
// collects arguments until wait time has passed without receiving new calls.
// When wait period is over, calls the original function with the collected arguments

const cancelled = Symbol('cancelled')

export default function debounceCollect(fn, wait) {
  let timer
  let queue = {}
  let idx = 0
  return function (...args) {
    return new Observable(obs => {
      clearTimeout(timer)
      timer = setTimeout(flush, wait)
      const queueItem = {
        args: args,
        observer: obs,
        cancelled: false
      }
      const id = idx++
      queue[id] = queueItem
      return () => {
        queueItem.cancelled = true
      }
    })
  }

  function flush() {
    const _queue = queue
    queue = {}

    const queueItemIds = Object.keys(_queue).filter(id => !_queue[id].cancelled)
    if (queueItemIds.length === 0) {
      // nothing to do
      return
    }
    const collectedArgs = queueItemIds.map(id => _queue[id].args)
    fn(collectedArgs).subscribe({
      next: results => {
        results.forEach((result, i) => {
          const entry = _queue[queueItemIds[i]]
          if (!entry.cancelled) {
            entry.observer.next(results[i])
            entry.observer.complete()
          }
        })
      },
      complete() {
        queueItemIds.forEach(id => {
          const entry = _queue[id]
          if (!entry.cancelled) {
            entry.observer.complete()
          }
        })
      },
      error(err) {
        queueItemIds.forEach(id => {
          const entry = _queue[id]
          if (!entry.cancelled) {
            entry.observer.error(err)
          }
        })
      }
    })
  }
}
