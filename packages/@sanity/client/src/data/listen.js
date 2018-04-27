const assign = require('object-assign')
const Observable = require('@sanity/observable/minimal')
const polyfilledEventSource = require('@sanity/eventsource')
const pick = require('../util/pick')
const defaults = require('../util/defaults')
const encodeQueryString = require('./encodeQueryString')

const EventSource =
  typeof window !== 'undefined' && window.EventSource
    ? window.EventSource // Native browser EventSource
    : polyfilledEventSource // Node.js, IE etc

const possibleOptions = ['includePreviousRevision', 'includeResult']
const defaultOptions = {
  includeResult: true
}

module.exports = function listen(query, params, opts = {}) {
  const options = defaults(opts, defaultOptions)
  const listenOpts = pick(options, possibleOptions)
  const qs = encodeQueryString({query, params, options: listenOpts})
  const {url, token, withCredentials} = this.clientConfig

  const uri = `${url}${this.getDataUrl('listen', qs)}`
  const listenFor = options.events ? options.events : ['mutation']
  const shouldEmitReconnect = listenFor.indexOf('reconnect') !== -1

  const esOptions = {}
  if (token || withCredentials) {
    esOptions.withCredentials = true
  }

  if (token) {
    esOptions.headers = {
      Authorization: `Bearer ${token}`
    }
  }

  return new Observable(observer => {
    let es = getEventSource()
    let reconnectTimer
    let stopped = false
    let didOpen = false

    function onError() {
      // it is explicitly stopped, or never opened before failing.
      if (stopped || !didOpen) {
        return
      }

      emitReconnect()

      // Allow event handlers of `emitReconnect` to cancel/close the reconnect attempt
      if (stopped) {
        return
      }

      // Unless we've explicitly stopped the ES (in which case `stopped` should be true),
      // we should never be in a disconnected state. By default, EventSource will reconnect
      // automatically, in which case it sets readyState to `CONNECTING`, but in some cases
      // (like when a laptop lid is closed), it closes the connection. In these cases we need
      // to explicitly reconnect.
      if (es.readyState === EventSource.CLOSED) {
        unsubscribe()
        clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(open, 100)
      }
    }

    function onChannelError(err) {
      observer.error(cooerceError(err))
    }

    function onMessage(evt) {
      const event = parseEvent(evt)
      return event instanceof Error ? observer.error(event) : observer.next(event)
    }

    function onDisconnect(evt) {
      stopped = true
      unsubscribe()
      observer.complete()
    }

    function onOpen(evt) {
      didOpen = true
    }

    function unsubscribe() {
      es.removeEventListener('error', onError, false)
      es.removeEventListener('channelError', onChannelError, false)
      es.removeEventListener('disconnect', onDisconnect, false)
      listenFor.forEach(type => es.removeEventListener(type, onMessage, false))
      es.close()
    }

    function emitReconnect() {
      if (shouldEmitReconnect) {
        observer.next({type: 'reconnect'})
      }
    }

    function getEventSource() {
      const evs = new EventSource(uri, esOptions)
      evs.addEventListener('error', onError, false)
      evs.addEventListener('open', onOpen, false)
      evs.addEventListener('channelError', onChannelError, false)
      evs.addEventListener('disconnect', onDisconnect, false)
      listenFor.forEach(type => evs.addEventListener(type, onMessage, false))
      return evs
    }

    function open() {
      es = getEventSource()
    }

    function stop() {
      stopped = true
      unsubscribe()
    }

    return stop
  })
}

function parseEvent(event) {
  try {
    const data = (event.data && JSON.parse(event.data)) || {}
    return assign({type: event.type}, data)
  } catch (err) {
    return err
  }
}

function cooerceError(err) {
  if (err instanceof Error) {
    return err
  }

  const evt = parseEvent(err)
  return evt instanceof Error ? evt : new Error(extractErrorMessage(evt))
}

function extractErrorMessage(err) {
  if (!err.error) {
    return err.message || 'Unknown listener error'
  }

  if (err.error.description) {
    return err.error.description
  }

  return typeof err.error === 'string' ? err.error : JSON.stringify(err.error, null, 2)
}
