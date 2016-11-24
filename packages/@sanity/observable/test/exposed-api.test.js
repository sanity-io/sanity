const {test} = require('tap')
const Observable = require('../src/SanityObservable')

// Strict assertions on the exposed api - kept here in order to ease future refactorings.

const staticProps = Object.keys(Observable)

test('static properties', t => {
  const staticFields = staticProps.filter(key => typeof Observable[key] !== 'function')
  t.ok(staticFields.length === 0, `Expected SanityObservable to have no static fields, instead found ${staticFields}`)
  t.end()
})

test('static methods', t => {
  const staticFunctions = staticProps.filter(key => typeof Observable[key] === 'function')
  t.same(staticFunctions, [
    'of',
    'from'
  ])
  t.end()
})

function getInheritedAndOwnProperties(obj) {
  const res = []
  for (const prop in obj) { // eslint-disable-line guard-for-in
    res.push(prop)
  }
  return res
}

test('instance methods', t => {
  const instance = new Observable(() => {
  })
  t.same(getInheritedAndOwnProperties(instance), [
    '_isScalar', // added by rxjs
    '_subscribe', // added by rxjs
    'map',
    'filter',
    'reduce',
    'flatMap',
    'toPromise',
    'lift',
    'subscribe',
    'forEach' // spec
  ])

  ;['map',
    'filter',
    'reduce',
    'flatMap',
    'toPromise',
    'lift',
    'subscribe',
    'forEach'
  ]
    .forEach(method => t.type(instance[method], 'function', `Expected observable instance to expose the method ${method}`))

  t.end()
})
