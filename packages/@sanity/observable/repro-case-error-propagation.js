// const {create} = require('observable-props')
// const {Observable} = require('rxjs')
const {Observable} = require('rxjs/Observable')
const {of} = require('rxjs/observable/of')
const {map} = require('rxjs/operator/map')
const {merge} = require('rxjs/operator/merge')
const {mergeMap} = require('rxjs/operator/mergeMap')
const {switchMap} = require('rxjs/operator/switchMap')

class CustomObservable extends Observable {
  static of(...args) {
    return new CustomObservable((observer) => of(...args).subscribe(observer))
  }
  lift(operator) {
    const observable = new CustomObservable()
    observable.source = this
    observable.operator = operator
    return observable
  }
}

Object.assign(CustomObservable.prototype, {
  map,
  merge,
  flatMap: mergeMap,
  mergeMap: mergeMap,
  switchMap: switchMap,
})

function fetchAsync(result) {
  return new CustomObservable((observer) => {
    setTimeout(() => observer.next(result), 0)
  })
}

// Throws in rxjs 5.0, fails silently in rxjs 5.1.x
fetchAsync({ok: 1})
  .switchMap((ok) => CustomObservable.of(ok))
  .map((notOk) => notOk.nothere.fail)
  .subscribe((v) => console.log(v))
