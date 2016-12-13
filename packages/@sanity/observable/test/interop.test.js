const {test} = require('tap')

const RxObservable = require('rxjs').Observable
const ZenObservable = require('zen-observable')
const isObservable = require('is-observable')

const SanityObservableMinimal = require('../src/SanityObservableMinimal')
const SanityObservable = require('../src/SanityObservable')

function toArray(acc, val) {
  return acc.concat(val)
}

test('it works with is-observable', t => {
  t.ok(isObservable(new SanityObservableMinimal(() => {})), 'Expected is-observable to identify SanityObservableMinimal as an Observable')
  t.ok(isObservable(new SanityObservable(() => {})), 'Expected is-observable to identify SanityObservableMinimal as an Observable')
  t.end()
})

test('it works with full fledged rx observables', t => {
  const stream = SanityObservable
    .of('Foo, Bar, SKIP, Baz')
    .flatMap(str => str.split(/,\s*/))
    .filter(word => word !== 'SKIP')
    .map(word => word.toUpperCase())
    .flatMap(word => new RxObservable(observer => {
      observer.next(`prefix-${word}`)
      observer.complete()
    }))

  t.ok(stream instanceof SanityObservable, 'Expected flatMap to maintain original observable constructor')

  stream
    .reduce(toArray, [])
    .subscribe(values => {
      t.same(values, ['prefix-FOO', 'prefix-BAR', 'prefix-BAZ'])
      t.end()
    })
})

test('SanityObservable with flatMap returning an instance of SanityObservableMinimal', t => {
  const stream = SanityObservable
    .from([1, 2])
    .flatMap(num => {
      return new SanityObservableMinimal(observer => {
        observer.next(num * num)
        observer.complete()
      })
    })

  t.ok(stream instanceof SanityObservable, 'Expected flatMap to maintain original observable constructor')

  stream
    .reduce(toArray, [])
    .subscribe(squares => {
      t.same(squares, [1, 4])
      t.end()
    })
})

test('Works with zen-observable', t => {
  const stream = SanityObservable
    .from([1, 2])
    .flatMap(num => {
      return new ZenObservable(observer => {
        observer.next(num * num)
        observer.complete()
      })
    })

  t.ok(stream instanceof SanityObservable, 'Expected flatMap to maintain original observable constructor')

  stream
    .reduce(toArray, [])
    .subscribe(squares => {
      t.same(squares, [1, 4])
      t.end()
    })
})

test('Can be wrapped in an RxObservable', t => {
  let subscribeCount = 0
  RxObservable.from(new SanityObservable(observer => {
    subscribeCount++
    if (subscribeCount < 5) {
      observer.error(new Error('Ooops, that failed'))
    } else {
      observer.next('OK')
      observer.complete()
    }
  }))
    // can now use rxjs observable methods
    .retryWhen(errors => errors
      .delay(100)
      .scan((count, error) => {
        if (count > 4) {
          throw error
        }
        return count + 1
      }, 0)
    )
    .subscribe(value => {
      t.equal(value, 'OK')
      t.end()
    })
})
