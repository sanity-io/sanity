import Observable from './SanityStoreObservable'

export default function promiseToObservable(promise) {
  return new Observable(subscriber => {
    promise.then(onSuccess, onError)

    function onSuccess(value) {
      subscriber.next(value)
      complete()
    }

    function onError(error) {
      subscriber.error(error)
      complete()
    }

    function complete() {
      subscriber.complete()
    }
  })
}
