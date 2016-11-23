const Observable = require('@sanity/observable')

module.exports = function fromPromise(promise) {
  return new Observable(observer => {
    promise.then(
      value => {
        observer.next(value)
        observer.complete()
      },
      error => {
        observer.error(error)
      }
    )
  })
}
