const {Observable} = require('rxjs/Observable')
const {of} = require('rxjs/observable/of')
const {forkJoin} = require('rxjs/observable/forkJoin')
const {from} = require('rxjs/observable/from')
const {map} = require('rxjs/operator/map')
const {filter} = require('rxjs/operator/filter')
const {reduce} = require('rxjs/operator/reduce')
const {scan} = require('rxjs/operator/scan')
const {debounceTime} = require('rxjs/operator/debounceTime')
const {distinctUntilChanged} = require('rxjs/operator/distinctUntilChanged')
const {takeUntil} = require('rxjs/operator/takeUntil')
const {withLatestFrom} = require('rxjs/operator/withLatestFrom')
const {merge} = require('rxjs/operator/merge')
const {share} = require('rxjs/operator/share')
const {mergeMap} = require('rxjs/operator/mergeMap')
const {switchMap} = require('rxjs/operator/switchMap')
const {_do} = require('rxjs/operator/do')
const {concatMap} = require('rxjs/operator/concatMap')
const {toPromise} = require('rxjs/operator/toPromise')

/*
  A subset of rxjs that align as closely as possible with the current es-observable spec
*/
function SanityObservable(...args) {
  Observable.call(this, ...args)
}

SanityObservable.prototype = Object.create(Object.assign({}, Observable.prototype))
Object.defineProperty(SanityObservable.prototype, 'constructor', {
  value: SanityObservable,
  enumerable: false,
  writable: true,
  configurable: true
})

function lift(operator) {
  const observable = new SanityObservable()
  observable.source = this
  observable.operator = operator
  return observable
}

Object.assign(SanityObservable.prototype, {
  map,
  filter,
  reduce,
  scan,
  merge,
  flatMap: mergeMap,
  mergeMap: mergeMap,
  switchMap: switchMap,
  concatMap: concatMap,
  share,
  debounceTime,
  distinctUntilChanged,
  withLatestFrom,
  takeUntil,
  do: _do,
  toPromise,
  lift
})

SanityObservable.of = function SanityObservableOf(...args) {
  return new SanityObservable(observer => of(...args).subscribe(observer))
}

SanityObservable.from = function SanityObservableFrom(...args) {
  return new SanityObservable(observer => from(...args).subscribe(observer))
}

SanityObservable.forkJoin = function SanityObservableForkJoin(...args) {
  return new SanityObservable(observer => forkJoin(...args).subscribe(observer))
}

module.exports = SanityObservable
