// Try triggering the symbol observable issue by loading zen-observable first
require('zen-observable')

const SanityObservable = require('../../src/SanityObservable')
const SanityObservableMinimal = require('../../src/SanityObservableMinimal')

const isObservable = require('is-observable')
const {test} = require('tap')

test('SanityObservable does not fail the is-observable test', t => {
  t.ok(
    isObservable(new SanityObservable(() => {})),
    'Expected SanityObservable to be an observable according to the is-observable module'
  )
  t.end()
})

test('SanityObservableMinimal does not fail the is-observable test', t => {
  t.ok(
    isObservable(new SanityObservableMinimal(() => {})),
    'Expected SanityObservableMinimal to be an observable according to the is-observable module'
  )
  t.end()
})
