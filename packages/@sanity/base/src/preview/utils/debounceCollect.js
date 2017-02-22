import Observable from '@sanity/observable'

// Takes a observable returning function and returns a debounced function that
// collects arguments until wait time has passed without receiving new calls.
// When wait period is over, calls the original function with the collected arguments

export default function debounceCollect(fn, wait) {
  let timer
  let pendingArgs = []
  let observable = null
  let observer = null
  return function (...args) {
    const index = pendingArgs.push(args) - 1
    if (!observable) {
      observable = new Observable(obs => {
        observer = obs
      }).share()
    }
    clearTimeout(timer)
    timer = setTimeout(flush, wait)
    return observable.map(value => value[index])
  }

  function flush() {
    const _args = pendingArgs
    const _observer = observer
    pendingArgs = []
    observer = null
    observable = null
    fn(_args).subscribe(_observer)
  }
}
