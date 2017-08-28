const {Observable} = require('rxjs/Observable')
const {of} = require('rxjs/observable/of')
const {combineLatest} = require('rxjs/observable/combineLatest')
const {forkJoin} = require('rxjs/observable/forkJoin')
const {from} = require('rxjs/observable/from')
const {map} = require('rxjs/operator/map')
const {filter} = require('rxjs/operator/filter')
const {concat} = require('rxjs/operator/concat')
const {reduce} = require('rxjs/operator/reduce')
const {scan} = require('rxjs/operator/scan')
const {first} = require('rxjs/operator/first')
const {debounceTime} = require('rxjs/operator/debounceTime')
const {distinctUntilChanged} = require('rxjs/operator/distinctUntilChanged')
const {takeUntil} = require('rxjs/operator/takeUntil')
const {withLatestFrom} = require('rxjs/operator/withLatestFrom')
const {merge} = require('rxjs/operator/merge')
const {share} = require('rxjs/operator/share')
const {mergeMap} = require('rxjs/operator/mergeMap')
const {publishReplay} = require('rxjs/operator/publishReplay')
const {_catch} = require('rxjs/operator/catch')
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
  concat,
  filter,
  reduce,
  scan,
  merge,
  flatMap: mergeMap,
  first,
  mergeMap: mergeMap,
  switchMap: switchMap,
  concatMap: concatMap,
  share,
  publishReplay,
  debounceTime,
  distinctUntilChanged,
  withLatestFrom,
  takeUntil,
  do: _do,
  catch: _catch,
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
SanityObservable.combineLatest = function SanityObservableCombineLatest(...args) {
  return new SanityObservable(observer => combineLatest(...args).subscribe(observer))
}

module.exports = SanityObservable
