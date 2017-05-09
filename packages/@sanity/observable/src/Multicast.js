const Observable = require('./SanityObservable')

/*
  A super simple implementation of an observable based multicast.
  Think of it as a Promise/Deferred that exposes its .resolve and .reject, but for observables instead, exposing
  .next, .error and .complete.

  Note: It's not compatible with Rx.Subject since it is *not* an observable itself. Consumers will have to call `asObservable`
  to get an observable representation.
 */

function Multicast() {
  this._observable = new Observable(observer => {
    this.next = val => observer.next(val)
    this.complete = () => observer.complete()
    this.error = err => observer.error(err)
  })
    .share()
}

Multicast.prototype.asObservable = function asObservable() {
  return new Observable(observer => this._observable.subscribe(observer))
}

module.exports = Multicast
