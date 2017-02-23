const assert = require('assert')
const tap = require('tap')
const Observable = require('../src/SanityObservable')

function fetchAsync(result) {
  return new Observable(observer => {
    const timeout = setTimeout(() => {
      observer.next(result)
      observer.complete()
    }, 0)
    return () => clearTimeout(timeout)
  })
}

process.once('uncaughtException', error => {
  tap.same(error.message, "Cannot read property 'fail' of undefined")
  process.exit(0)
})

fetchAsync({ok: 1})
  .switchMap(ok => Observable.of(ok))
  .map(notOk => notOk.nothere.fail)
  .subscribe()

setTimeout(() => {
  tap.fail('Expected an exception to be thrown')
}, 10)
