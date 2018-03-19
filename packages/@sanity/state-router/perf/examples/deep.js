const range = require('lodash/range')

const ROUTES = 100
const DEPTH = 10

function addLevel(prefix, depth, n = 0) {
  return [
    `/deeper-${prefix}/:level-${prefix}-${n}`,
    n <= depth && [addLevel(prefix, depth, n + 1)]
  ].filter(Boolean)
}

exports.routes = [
  '/',
  range(ROUTES).map(prefix => {
    return addLevel(prefix, DEPTH)
  })
]

exports.states = range(ROUTES).map(prefix => {
  const stateKeys = range(DEPTH).map(level => `level-${prefix}-${level}`)
  const state = stateKeys.reduce((acc, key) => {
    acc[key] = Math.random()
      .toString(32)
      .substring(2)
    return acc
  }, {})

  const path = stateKeys.map(key => `/deeper-${prefix}/${state[key]}`).join('')

  return [path, state]
})
