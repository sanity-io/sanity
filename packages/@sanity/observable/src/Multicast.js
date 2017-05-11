const Observable = require('./SanityObservable')

/*
  A super simple implementation of an observable based multicast.
  Think of it as a Promise/Deferred that exposes its .resolve and .reject, but for observables instead, exposing
  .next, .error and .complete.

  Note: It's not compatible with Rx.Subject since it is *not* an observable itself. Consumers will have to call `asObservable`
  to get an observable representation.
 */

function Multicast() {
  this._observer = null
  this._observable = new Observable(observer => {
    if (this._observer) {
      throw new Error('Duplicate observers. This should never happen!')
    }
    this._observer = observer
    return () => {
      this._observer = null
    }
  })
    .share()
}

Multicast.prototype.next = function next(val) {
  if (this._observer) {
    this._observer.next(val)
  }
}

Multicast.prototype.error = function error(err) {
  if (this._observer) {
    this._observer.error(err)
  }
}

Multicast.prototype.complete = function complete() {
  if (this._observer) {
    this._observer.complete()
  }
}

Multicast.prototype.asObservable = function asObservable() {
  return new Observable(observer => this._observable.subscribe(observer))
}

module.exports = Multicast
