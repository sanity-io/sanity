'use strict'

var _rxjs = require('rxjs')

var _uuid = _interopRequireDefault(require('@sanity/uuid'))

var _deepEqual = _interopRequireDefault(require('deep-equal'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object)
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object)
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable
      })
    keys.push.apply(keys, symbols)
  }
  return keys
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key])
      })
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
      })
    }
  }
  return target
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }
  return obj
}

var RESEND_REPORT_INTERVAL = 15000
var STATE_TIMEOUT_INTERVAL = RESEND_REPORT_INTERVAL * 2

function hashKeyForState(identity, session) {
  return ''.concat(identity, '__').concat(session)
}

class PresenceStore {
  constructor(connection, channel) {
    _defineProperty(
      this,
      'presence',
      new _rxjs.Observable((observer) => {
        // Send initial state
        observer.next(this.getStateReport()) // Set up subscription to track subsequent changes

        var reporter = (value) => {
          observer.next(value)
        }

        this.subscriberCallbacks.push(reporter) // Create and return unsubscriber

        var unsubscribe = () => {
          this.subscriberCallbacks = this.subscriberCallbacks.filter((cb) => cb != reporter)
        }

        return unsubscribe
      })
    )

    _defineProperty(this, 'handleMessage', (msg) => {
      // Ignore messages from ourselves
      if (msg.m.session == this.sessionId) {
        return
      }

      switch (msg.m.type) {
        case 'state': {
          this.updateClientState(msg)
          return
        }

        case 'rollCall':
          this.sendMyState()
          break

        case 'disconnect':
          this.states.delete(hashKeyForState(msg.i, msg.m.session))
          this.handleRemoteChange()
          break

        default:
      }
    })

    _defineProperty(this, 'performPurge', () => {
      var now = Date.now()
      Array.from(this.states.keys()).forEach((key) => {
        var age = now - this.timestamps.get(key)

        if (age > STATE_TIMEOUT_INTERVAL) {
          this.states.delete(key)
          this.timestamps.delete(key)
          this.handleRemoteChange()
        }
      })
    })

    _defineProperty(this, 'reportChangesToAllSubscribers', () => {
      var report = this.getStateReport()
      this.subscriberCallbacks.forEach((cb) => cb(report))
    })

    this.connection = connection
    this.messageSubscription = this.connection.listen().subscribe(this.handleMessage)
    this.myState = {}
    this.states = new Map()
    this.timestamps = new Map()
    this.resendReportTimer = null
    this.changeReportDebounceTimer = null
    this.performPurgeTimer = setInterval(this.performPurge, 2000)
    this.sessionId = (0, _uuid.default)()
    this.requestRollCall() // List of functions that will be called with presence change notifications

    this.subscriberCallbacks = []
  } // Close Presence Store, should be called when window closes

  close() {
    this.connection.sendBeacon({
      type: 'disconnect',
      session: this.sessionId,
    })
    this.messageSubscription.unsubscribe()
    clearTimeout(this.resendReportTimer)
    clearInterval(this.performPurgeTimer)
    clearTimeout(this.changeReportDebounceTimer)
  } // The observable that all subscribers will use to track state changes

  // Call this to report this clients state
  reportMyState(state) {
    this.myState = state
    this.sendMyState()
  } // Updates state for a client based on an incoming state message

  updateClientState(msg) {
    // Construct next state object
    var state = _objectSpread(
      {
        identity: msg.i,
      },
      msg.m
    )

    delete state.type // The cache key for this state

    var key = hashKeyForState(msg.i, msg.m.session) // Only update state if state is actually changed

    if (!(0, _deepEqual.default)(state, this.states.get(key))) {
      this.states.set(key, state)
      this.handleRemoteChange()
    } // Update timestamp for this cache key

    this.timestamps.set(key, Date.now())
  }

  // Called whenever the remote states change
  handleRemoteChange() {
    // Reports changes with a slight debounce
    clearTimeout(this.changeReportDebounceTimer)
    this.changeReportDebounceTimer = setTimeout(this.reportChangesToAllSubscribers, 250)
  }

  getStateReport() {
    return Array.from(this.states.keys())
      .sort()
      .map((key) => this.states.get(key))
  }

  sendMyState() {
    clearTimeout(this.resendReportTimer)
    this.send('state', this.myState)
    this.resendReportTimer = setTimeout(() => {
      this.sendMyState()
    }, RESEND_REPORT_INTERVAL)
  }

  requestRollCall() {
    this.send('rollCall', {})
  }

  send(msgType, msg) {
    return this.connection.send(
      _objectSpread(
        {
          type: msgType,
          session: this.sessionId,
        },
        msg
      )
    )
  }
} // eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = PresenceStore
