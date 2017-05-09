/* eslint no-shadow: ["error", { "allow": ['t'] }] */

const {test} = require('tap')
const Multicast = require('../src/Multicast')

test('It can broadcast a value to its subscriber', t => {
  const multicast = new Multicast()

  const observable = multicast.asObservable()
  const subscription = observable.subscribe(value => {
    t.equal(value, 'something')
    t.end()
  })

  multicast.next('something')
  subscription.unsubscribe()
})

test('Its .toObservable returns separate observables', t => {
  const multicast = new Multicast()

  const observable = multicast.asObservable()
  const observable2 = multicast.asObservable()

  t.notEqual(observable, observable2)
  t.end()
})

test("It doesn't notify unsubscribed observers", t => {
  const multicast = new Multicast()
  const observable = multicast.asObservable()

  observable.subscribe(() => {
    t.error('Unsubscribed observer should never have been called')
  })
    .unsubscribe()

  multicast.next()

  t.end()
})

test('It handles unsubscribe/resubscribe', t => {
  const multicast = new Multicast()
  const observable = multicast.asObservable()
  const observable2 = multicast.asObservable()

  observable
    .subscribe(() => t.fail('Unsubscribed observer should never have been called'))
    .unsubscribe()

  multicast.next()

  observable2.subscribe({
    next: val => t.equal(val, 'Foobar'),
    complete: t.end
  })

  multicast.next('Foobar')
  multicast.complete()
})
