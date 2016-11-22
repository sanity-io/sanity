const {test} = require('tap')

// The order here is important -- see below
const ZenObservable = require('zen-observable')
const isObservable = require('is-observable')
// ---

const descr = `
This just asserts the existence of the issue described here: if/when this is fixed and this becomes a test failure,
this whole file can safely be deleted. See
https://github.com/sindresorhus/is-observable/issues/1#issuecomment-214479549
`

test('zen-observable fails is-observable test given the require() order above', t => {
  t.notOk(
    isObservable(new ZenObservable(() => {})),
    `Expected zen-observable to **NOT** be an observable: ${descr}`
  )
  t.end()
})
