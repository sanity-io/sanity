/* eslint-env browser */
/* eslint-disable complexity, no-console, camelcase, no-case-declarations, max-depth */
const strip = require('strip-ansi')
const clientOverlay = require('webpack-hot-middleware/client-overlay')
const processUpdate = require('./process-update')
const polyfilledEventSource = require('@sanity/eventsource')

const TIMEOUT = 20 * 1000
const RECONNECT_TIMEOUT = 2500
const HEARTBEAT = '\uD83D\uDC93'
const HMR_PATH = '/__webpack_hmr'
const REPORTER_KEY = '__webpack_hot_middleware_reporter__'
const EVENTBUS_KEY = '__webpack_hot_middleware_eventbus__'

const EVENT_CONNECTED = 'connected'
const EVENT_CONNECTING = 'connecting'
const EVENT_DISCONNECTED = 'disconnected'
const EVENT_BUILDING = 'building'
const EVENT_BUILT = 'built'
const EVENT_SYNC = 'sync'
const EVENT_CHECKING_FOR_UPDATES = 'checking-for-updates'
const EVENT_NOTHING_UPDATED = 'nothing-updated'
const EVENT_APPLY_ERROR = 'apply-error'
const EVENT_UNACCEPTED = 'unaccepted'
const EVENT_UPDATE_CHECK_FAILED = 'update-check-failed'
const EVENT_UPDATED = 'updated'
const EVENT_UPDATE_NOT_FOUND = 'update-not-found'
const EVENT_UP_TO_DATE = 'up-to-date'

const REQUIRES_RELOAD = [
  EVENT_UPDATE_NOT_FOUND,
  EVENT_UNACCEPTED,
  EVENT_APPLY_ERROR,
  EVENT_UPDATE_CHECK_FAILED,
]

const REPORTER_STYLES = {
  errors: 'color: #ff0000;',
  warnings: 'color: #999933;',
}

;(function hotMiddlewareClient() {
  if (typeof window === 'undefined') {
    // Do nothing if not in a browser context
    return
  }

  let es
  let isConnected = false
  let lastActivity = new Date()
  let timeoutCheckTimer

  window[EVENTBUS_KEY] = window[EVENTBUS_KEY] || createEventBus({isConnected: () => isConnected})
  window[REPORTER_KEY] = window[REPORTER_KEY] || createReporter()
  const reporter = window[REPORTER_KEY]
  const eventBus = window[EVENTBUS_KEY]

  const getEventPublisher = (type) => (evt = {}) => {
    eventBus.publish({...evt, type, requiresReload: REQUIRES_RELOAD.includes(type)})
  }

  const hmrHandlers = {
    handleCheckUpdate: getEventPublisher(EVENT_CHECKING_FOR_UPDATES),
    handleError: getEventPublisher(EVENT_APPLY_ERROR),
    handleNothingUpdated: getEventPublisher(EVENT_NOTHING_UPDATED),
    handleUnaccepted: getEventPublisher(EVENT_UNACCEPTED),
    handleUpdateCheckFailed: getEventPublisher(EVENT_UPDATE_CHECK_FAILED),
    handleUpdated: getEventPublisher(EVENT_UPDATED),
    handleUpdateNotFound: getEventPublisher(EVENT_UPDATE_NOT_FOUND),
    handleUpToDate: getEventPublisher(EVENT_UP_TO_DATE),
  }

  connect()

  function connect() {
    eventBus.publish({type: EVENT_CONNECTING})

    const EventSource = window.EventSource || polyfilledEventSource
    es = new EventSource(HMR_PATH)
    es.onopen = handleOnline
    es.onerror = handleDisconnect
    es.onmessage = handleMessage

    timeoutCheckTimer = setInterval(handleCheckTimeout, TIMEOUT / 2)
  }

  function handleOnline() {
    console.log('[HMR] connected')
    eventBus.publish({type: EVENT_CONNECTED})
    lastActivity = new Date()
    isConnected = true
  }

  function handleMessage(event) {
    lastActivity = new Date()

    if (event.data === HEARTBEAT) {
      return
    }

    processMessage(parseMessage(event))
  }

  function handleCheckTimeout() {
    if (new Date() - lastActivity > TIMEOUT) {
      handleDisconnect()
    }
  }

  function handleDisconnect() {
    clearInterval(timeoutCheckTimer)
    es.close()
    isConnected = false
    eventBus.publish({type: EVENT_DISCONNECTED})
    setTimeout(connect, RECONNECT_TIMEOUT)
  }

  function parseMessage(event) {
    try {
      return JSON.parse(event.data)
    } catch (ex) {
      console.warn(`Invalid HMR message: ${event.data}\n${ex}`)
    }

    return false
  }

  function processMessage(evt) {
    if (!evt) {
      return
    }

    eventBus.publish({...evt, type: evt.action})

    switch (evt.action) {
      case EVENT_BUILDING:
        console.log(`[HMR] bundle rebuilding`)
        break
      case EVENT_BUILT:
        console.log(`[HMR] bundle rebuilt in ${evt.time} ms`)
      // fall through
      case EVENT_SYNC:
        let applyUpdate = true
        const hasWarnings = evt.warnings.length > 0
        const hasErrors = evt.errors.length > 0
        if (hasErrors) {
          reporter.problems('errors', evt)
          applyUpdate = false
        } else if (hasWarnings) {
          const overlayShown = reporter.problems('warnings', evt)
          applyUpdate = overlayShown
        } else if (!hasWarnings) {
          reporter.cleanProblemsCache()
          reporter.success()
        }

        if (applyUpdate) {
          processUpdate(evt.hash, evt.modules, hmrHandlers)
        }

        break
      default:
    }
  }
})()

function createReporter() {
  const overlay = clientOverlay({
    ansiColors: {},
    overlayStyles: {},
  })

  function formatProblems(type, obj) {
    return obj[type].map((msg) => strip(msg)).join('\n')
  }

  let previousProblems = null
  function log(type, obj) {
    const newProblems = formatProblems(type, obj)

    if (previousProblems === newProblems) {
      return
    }

    previousProblems = newProblems

    const style = REPORTER_STYLES[type]
    const title = `[HMR] bundle has ${obj[type].length} ${type}`
    // NOTE: console.warn or console.error will print the stack trace
    // which isn't helpful here, so using console.log to escape it.
    if (console.group && console.groupEnd) {
      console.group(`%c${title}`, style)
      console.log(`%c${newProblems}`, style)
      console.groupEnd()
    } else {
      console.log(
        `%c${title}\n\t%c${newProblems.replace(/\n/g, '\n\t')}`,
        `${style}font-aweight: bold;`,
        `${style}font-weight: normal;`
      )
    }
  }

  return {
    cleanProblemsCache() {
      previousProblems = null
    },
    problems(type, obj) {
      log(type, obj)

      if (overlay) {
        if (type === 'errors') {
          overlay.showProblems(type, obj[type])
          return false
        }
        overlay.clear()
      }
      return true
    },
    success() {
      if (overlay) {
        overlay.clear()
      }
    },
  }
}

function createEventBus({isConnected}) {
  const listeners = []
  return {
    publish: (msg) => listeners.forEach((listener) => listener(msg)),
    subscribe: (fn) => {
      listeners.push(fn)
      if (isConnected()) {
        fn({type: EVENT_CONNECTED})
      }
      return () => listeners.splice(listeners.indexOf(fn), 1)
    },
    eventTypes: {
      EVENT_CONNECTED,
      EVENT_CONNECTING,
      EVENT_DISCONNECTED,
      EVENT_BUILDING,
      EVENT_BUILT,
      EVENT_SYNC,
      EVENT_CHECKING_FOR_UPDATES,
      EVENT_NOTHING_UPDATED,
      EVENT_APPLY_ERROR,
      EVENT_UNACCEPTED,
      EVENT_UPDATE_CHECK_FAILED,
      EVENT_UPDATED,
      EVENT_UPDATE_NOT_FOUND,
      EVENT_UP_TO_DATE,
    },
  }
}
