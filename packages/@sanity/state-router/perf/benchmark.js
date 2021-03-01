/* eslint-disable no-console */
const route = require('../lib/route').default
const inspect = require('object-inspect')
const assert = require('assert')
const resolveStateFromPath = require('../lib/resolveStateFromPath').default
const resolvePathFromState = require('../lib/resolvePathFromState').default

console.log('\nRunning benchmarks…')

const examples = ['simple', 'deep']

function createRouteFromExample(path, children = []) {
  return route(
    path,
    children.map(([subPath, subChildren]) => {
      return createRouteFromExample(subPath, subChildren)
    })
  )
}

const memStart = process.memoryUsage().rss
let memMax = memStart

function group(name, fn) {
  return fn((iterations, label, timeFn) => {
    console.log(`Running ${name}: ${label} (x${iterations} iterations)`)
    return time('\tdone', () => {
      let it = iterations
      while (it--) {
        timeFn()
        memMax = Math.max(memMax, process.memoryUsage().rss)
      }
    })
  })
}

function time(label, fn) {
  console.time(label)
  fn()
  console.timeEnd(label)
}

function runExample(exampleName) {
  const example = require(`./examples/${exampleName}.js`)

  group(`${exampleName} example`, (run) => {
    run(100, 'creating routes…', () => {
      return createRouteFromExample(...example.routes)
    })

    const rootNode = createRouteFromExample(...example.routes)
    run(100, 'resolving state…', () => {
      example.states.forEach(([path, expectedState]) => {
        const actualState = resolveStateFromPath(rootNode, path)
        if (process.env.ASSERT) {
          assert.deepEqual(
            actualState,
            expectedState,
            `Expected state to be ${inspect(expectedState)} but got ${inspect(actualState)}`
          )
        }
      })
    })

    run(100, 'resolving path…', () => {
      example.states.forEach(([expectedPath, state]) => {
        const actualPath = resolvePathFromState(rootNode, state)
        if (process.env.ASSERT) {
          assert.deepEqual(
            actualPath,
            expectedPath,
            `Expected path to be ${inspect(expectedPath)} but got ${inspect(actualPath)}`
          )
        }
      })
    })
  })
}

examples.forEach(runExample)

const memEnd = process.memoryUsage().rss
console.log('\nMemory usage')
console.log('start: %d MB', memStart / 1024 / 1024)
console.log('max: %d MB', memMax / 1024 / 1024)
console.log('end: %d MB', memEnd / 1024 / 1024)
