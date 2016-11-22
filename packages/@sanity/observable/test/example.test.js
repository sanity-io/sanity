const {test} = require('tap')
const Observable = require('../src/SanityObservable')
const RxObservable = require('rxjs/Rx').Observable

function toArray(acc, val) {
  return acc.concat(val)
}

test('it works', t => {
  Observable
    .of('Foo, Bar, SKIP, Baz')
    .flatMap(str => str.split(/,\s*/))
    .filter(word => word !== 'SKIP')
    .map(word => word.toUpperCase())
    .flatMap(word => new RxObservable(observer => {
      observer.next(`prefix-${word}`)
      observer.complete()
    }))
    .reduce(toArray, [])
    .subscribe(values => {
      t.same(values, ['prefix-FOO', 'prefix-BAR', 'prefix-BAZ'])
      t.end()
    })
})
