const {Observable} = require('rxjs')
const observableFrom = require('rxjs').from
const pick = require('object.pick')
const Constants = require('../src/Constants')

const clientDefaults = {
  responses: [],
  events: [],
}

function getMockClient(opts) {
  const options = Object.assign({}, clientDefaults, opts)

  const fetch = jest.fn()
  const listen = jest.fn()

  let fetchCalls = 0
  fetch.mockImplementation(() => {
    const response = options.responses[fetchCalls++]
    if (response) {
      return observableFrom([response])
    }

    throw new Error(`Tried to call fetch() without a mock (on call #${fetchCalls})`)
  })

  const listenObservable = new Observable((observer) => {
    const timers = [setTimeout(() => observer.next({type: 'welcome'}), 15)]

    options.events.forEach((event, i) => {
      timers.push(setTimeout(() => observer.next(event), 20 + 5 * i))
    })

    timers.push(setTimeout(() => observer.complete(), 20 + (5 * options.events.length + 1)))

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  })

  listen.mockReturnValue(listenObservable)

  const observable = {fetch}
  const __mocks__ = {fetch: fetch.mock, listen: listen.mock}

  return {observable, listen, __mocks__}
}

function expectRangeQueryToMatchSnapshot(client, match) {
  expect(client.__mocks__.fetch.calls[0][0]).toMatchSnapshot()
}

function expectRangeQueryToMatchRange(client, expected) {
  const range = client.__mocks__.fetch.calls[0][0].toJSON()
  expect(pick(range, ['from', 'to'])).toMatchObject(expected)
}

function willBackfill(docWindow, options) {
  return new Promise((resolve, reject) => {
    let hasTimedOut = false
    const timer = setTimeout(rejectOnTimeout, (Constants.DEFAULT_DEBOUNCE_MS || 1) * 1.1)

    docWindow.on('backfill', (data) => {
      if (!hasTimedOut) {
        clearTimeout(timer)

        if (options) {
          expect(data).toMatchObject(options)
        }

        resolve(true)
      }
    })

    function rejectOnTimeout() {
      hasTimedOut = true
      resolve(false)
    }
  })
}

function atEmitNumber(num, fn) {
  let callIndex = 0
  return (...args) => {
    if (callIndex++ === num) {
      fn(...args)
    }
  }
}

function mockMutation(result, transition = 'update') {
  return Object.assign({
    type: 'mutation',
    documentId: result._id,
    transition,
    result,
  })
}

function waitForEvent(docWindow, event, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(rejectOnTimeout, 1000)
    let hasTimedOut = false

    docWindow.once(event, () => {
      if (!hasTimedOut) {
        clearTimeout(timer)
        resolve()
      }
    })

    function rejectOnTimeout() {
      hasTimedOut = true
      reject(new Error(`Timed out while waiting for event "${event}"`))
    }
  })
}

// Just an alias for readability
function waitForEmitEvents(...args) {
  gatherWindows(...args)
}

function gatherWindows(docWindow, numWindows = 2) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(rejectOnTimeout, 1000)
    const windows = []
    let hasTimedOut = false

    const onData = (data) => {
      windows.push(data)

      if (!hasTimedOut && windows.length === numWindows) {
        clearTimeout(timer)
        resolve(windows)
      }
    }

    docWindow.on('data', onData)

    function rejectOnTimeout() {
      hasTimedOut = true
      reject(new Error(`Timed out while waiting for data emit number ${windows.length + 1}`))
    }
  })
}

module.exports = {
  getMockClient,
  expectRangeQueryToMatchRange,
  expectRangeQueryToMatchSnapshot,
  atEmitNumber,
  mockMutation,
  gatherWindows,
  waitForEmitEvents,
  waitForEvent,
  willBackfill,
}
