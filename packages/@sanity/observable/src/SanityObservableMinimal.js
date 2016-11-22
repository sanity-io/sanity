const {Observable} = require('rxjs/Observable')
const {map} = require('rxjs/operator/map')
const {filter} = require('rxjs/operator/filter')
const {reduce} = require('rxjs/operator/reduce')

/*
 A minimal rxjs based observable that align as closely as possible with the current es-observable spec,
 without the static factory methods
 */
function SanityObservableMinimal() {
  Observable.apply(this, arguments) // eslint-disable-line prefer-rest-params
}

SanityObservableMinimal.prototype = Object.create(Observable.prototype)
SanityObservableMinimal.prototype.constructor = SanityObservableMinimal

SanityObservableMinimal.prototype.lift = function lift(operator) {
  const observable = new SanityObservableMinimal()
  observable.source = this
  observable.operator = operator
  return observable
}

SanityObservableMinimal.prototype.map = map
SanityObservableMinimal.prototype.filter = filter
SanityObservableMinimal.prototype.reduce = reduce

module.exports = SanityObservableMinimal
