/* eslint no-shadow: ["error", { "allow": ['t'] }] */

const {test} = require('tap')
const Observable = require('../src/SanityObservableMinimal')

// Strict assertions on the exposed api - kept here in order to ease future refactorings.
function run(t) {
  const staticProps = Object.keys(Observable)

  test('static properties', t => {
    const staticFields = staticProps.filter(key => typeof Observable[key] !== 'function')
    t.ok(
      staticFields.length === 0,
      `Expected SanityObservable to have no static fields, instead found ${staticFields}`
    )
    t.end()
  })

  test('static methods', t => {
    const staticFunctions = staticProps.filter(key => typeof Observable[key] === 'function')
    t.same(staticFunctions, [])
    t.end()
  })

  function getInheritedAndOwnProperties(obj) {
    const res = []
    for (const prop in obj) {
      // eslint-disable-line guard-for-in
      res.push(prop)
    }
    return res
  }

  t.test('instance methods', t => {
    const instance = new Observable(() => {})
    t.same(getInheritedAndOwnProperties(instance), [
      '_isScalar', // rxjs internals
      '_subscribe', // rxjs internals
      'lift',
      'map',
      'filter',
      'reduce',
      'subscribe',
      '_trySubscribe', // rxjs internals
      'forEach', // spec
      'pipe',
      'toPromise'
    ])
    ;['map', 'filter', 'reduce', 'toPromise', 'lift', 'pipe', 'subscribe', 'forEach'].forEach(
      method =>
        t.type(
          instance[method],
          'function',
          `Expected observable instance to expose the method ${method}`
        )
    )

    t.end()
  })
}

test('Exposed api', {autoend: true}, run)

test('Exposed api should not be affected by require("rxjs")', {autoend: true}, t => {
  require('rxjs')
  run(t)
})
