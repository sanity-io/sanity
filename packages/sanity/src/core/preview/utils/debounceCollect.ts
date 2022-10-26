import {Observable, Subscriber} from 'rxjs'
import {isNonNullable} from '../../util'

interface QueueItem {
  args: any[]
  observer: Subscriber<any>
  completed: boolean
}

// Takes an observable returning function and returns a debounced function that, when called
// collects its passed arguments until wait time has passed without receiving new calls.
// When wait period is over, calls the original function with the collected arguments
export function debounceCollect<Fn extends (...args: any[]) => Observable<any[]>>(
  fn: Fn,
  wait: number
): Fn extends (collectedArgs: [...infer TArgs][]) => Observable<(infer TReturnValue)[]>
  ? (...args: TArgs) => Observable<TReturnValue>
  : never
export function debounceCollect(fn: any, wait: number) {
  let timer: ReturnType<typeof setTimeout>
  let queue: Record<number | string, QueueItem | undefined> = {}
  let idx = 0
  return function debounced(...args: any[]) {
    return new Observable((obs) => {
      clearTimeout(timer)
      timer = setTimeout(flush, wait)
      const queueItem: QueueItem = {
        args: args,
        observer: obs,
        completed: false,
      }
      const id = idx++
      queue[id] = queueItem
      return () => {
        // console.log('completed', queueItem.args)
        queueItem.completed = true
      }
    })
  }

  function flush() {
    const currentlyFlushingQueue = queue
    queue = {}

    const queueItemIds = Object.keys(currentlyFlushingQueue) // Todo: use debug
      // .map(id => {
      //   if (currentlyFlushingQueue[id].completed) {
      //     console.log('Dropped', currentlyFlushingQueue[id].args)
      //   }
      //   return id
      // })
      .filter((id) => {
        const queueItem = currentlyFlushingQueue[id]

        return queueItem && !queueItem.completed
      })

    if (queueItemIds.length === 0) {
      // nothing to do
      return
    }
    const collectedArgs = queueItemIds
      .map((id) => {
        const queueItem = currentlyFlushingQueue[id]

        return queueItem && queueItem.args
      })
      .filter(isNonNullable)
    fn(collectedArgs).subscribe({
      next(results: any[]) {
        results.forEach((result, i) => {
          const queueItem = currentlyFlushingQueue[queueItemIds[i]]
          if (queueItem && !queueItem.completed) {
            queueItem.observer.next(results[i])
          }
        })
      },
      complete() {
        queueItemIds.forEach((id) => {
          const entry = currentlyFlushingQueue[id]
          if (entry && !entry.completed) {
            entry.observer.complete()
          }
        })
      },
      error(err: Error) {
        queueItemIds.forEach((id) => {
          const entry = currentlyFlushingQueue[id]
          if (entry && !entry.completed) {
            entry.observer.error(err)
          }
        })
      },
    })
  }
}
