const Observable = require('@sanity/observable')

module.exports = function firstOf(observable, filterFn = value => true) {
  return new Observable(observer => {
    const subscription = observable.subscribe(value => {
      if (filterFn(value)) {
        observer.next(value)
        observer.complete()
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  })
}
