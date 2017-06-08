import Observable from '@sanity/observable'

// Takes a observable returning function and returns a debounced function that
// collects arguments until wait time has passed without receiving new calls.
// When wait period is over, calls the original function with the collected arguments

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
    const currentlyFlushingQueue = queue
    queue = {}

    const queueItemIds = Object.keys(currentlyFlushingQueue)
      .filter(id => !currentlyFlushingQueue[id].cancelled)
    if (queueItemIds.length === 0) {
      // nothing to do
      return
    }
    const collectedArgs = queueItemIds.map(id => currentlyFlushingQueue[id].args)
    fn(collectedArgs).subscribe({
      next(results) {
        results.forEach((result, i) => {
          const entry = currentlyFlushingQueue[queueItemIds[i]]
          if (!entry.cancelled) {
            entry.observer.next(results[i])
            entry.observer.complete()
          }
        })
      },
      complete() {
        queueItemIds.forEach(id => {
          const entry = currentlyFlushingQueue[id]
          if (!entry.cancelled) {
            entry.observer.complete()
          }
        })
      },
      error(err) {
        queueItemIds.forEach(id => {
          const entry = currentlyFlushingQueue[id]
          if (!entry.cancelled) {
            entry.observer.error(err)
          }
        })
      }
    })
  }
}
