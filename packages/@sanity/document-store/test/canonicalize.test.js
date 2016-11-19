import {test} from 'tap'
import Observable from 'zen-observable'
import canonicalize from '../src/utils/canonicalize'

const wait = ms => observer => {
  const timer = setTimeout(() => observer.next(), ms)
  return () => clearTimeout(timer)
}
const noop = () => {}

test("Don't call the producer unless there are subscribers", t => {
  const getKey = arg => arg

  let producerCalls = 0
  const producer = () => {
    producerCalls++
    return Observable.of('OK')
  }

  const canonical = canonicalize(getKey, producer)

  canonical('foo')
  canonical('foo')
  t.equal(producerCalls, 0)
  t.end()
})

test('Calls producer only once for multiple subscribers', t => {
  const getKey = arg => arg

  let producerCalls = 0
  const producer = () => {
    producerCalls++
    return new Observable(wait(100))
  }

  const canonical = canonicalize(getKey, producer)

  canonical('foo').subscribe(noop)
  canonical('foo').subscribe(noop)
  t.equal(producerCalls, 1)
  t.end()
})

test('subscribers share the same observable', t => {
  const getKey = arg => arg

  const producer = () => {
    const val = {some: 'object'}
    return new Observable(wait(100)).map(() => val)
  }

  const canonical = canonicalize(getKey, producer)

  canonical('foo').subscribe(outer => {
    canonical('foo').subscribe(inner => {
      t.equal(outer, inner)
      t.end()
    })
  })
})

test('keeps the subscription going until last subscriber unsubscribes', t => {
  const getKey = arg => arg

  let producerCalls = 0
  let unsubscribeCalls = 0
  const producer = () => {
    producerCalls++
    return new Observable(observer => {
      return () => {
        unsubscribeCalls++
      }
    })
  }

  const canonical = canonicalize(getKey, producer)

  t.equal(producerCalls, 0)
  t.equal(unsubscribeCalls, 0)

  const first = canonical('foo').subscribe(noop)
  const second = canonical('foo').subscribe(noop)
  t.equal(producerCalls, 1)
  t.equal(unsubscribeCalls, 0)

  first.unsubscribe(noop)

  t.equal(producerCalls, 1)
  t.equal(unsubscribeCalls, 1)

  second.unsubscribe(noop)

  t.equal(producerCalls, 1)
  t.equal(unsubscribeCalls, 2)

  const third = canonical('foo').subscribe(noop)

  t.equal(producerCalls, 2)
  t.equal(unsubscribeCalls, 2)

  third.unsubscribe(noop)
  t.equal(unsubscribeCalls, 3)
  t.end()
})


test('calls the producer again if last subscriber unsubscribed', t => {
  const getKey = arg => arg

  let producerCalls = 0
  let unsubscribeCalls = 0
  const producer = () => {
    producerCalls++
    return new Observable(observer => {
      return () => {
        unsubscribeCalls++
      }
    })
  }

  const canonical = canonicalize(getKey, producer)

  canonical('foo').subscribe(noop).unsubscribe(noop)

  canonical('foo').subscribe(noop).unsubscribe(noop)

  t.equal(producerCalls, 2)
  t.equal(unsubscribeCalls, 2)
  t.end()
})
