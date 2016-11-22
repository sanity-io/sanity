const {Observable} = require('rxjs/Observable')
const {of} = require('rxjs/observable/of')
const {from} = require('rxjs/observable/from')
const {map} = require('rxjs/operator/map')
const {filter} = require('rxjs/operator/filter')
const {reduce} = require('rxjs/operator/reduce')
const {mergeMap} = require('rxjs/operator/mergeMap')

/*
  A subset of rxjs that align as closely as possible with the current es-observable spec
*/
class SanityObservable extends Observable {
  lift(operator) {
    const observable = new SanityObservable()
    observable.source = this
    observable.operator = operator
    return observable
  }
}

Object.assign(SanityObservable.prototype, {
  map,
  filter,
  reduce,
  flatMap: mergeMap
})

SanityObservable.of = function SanityObservableOf(...args) {
  return new SanityObservable(observer => of(...args).subscribe(observer))
}

SanityObservable.from = function SanityObservableFrom(...args) {
  return new SanityObservable(observer => from(...args).subscribe(observer))
}

module.exports = SanityObservable
