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
    const es = new EventSource(uri, esOptions)

    es.addEventListener('error', onError, false)
    es.addEventListener('channelError', onChannelError, false)
    es.addEventListener('disconnect', onDisconnect, false)
    listenFor.forEach(type => es.addEventListener(type, onMessage, false))

    function onError() {
      if (es.readyState === EventSource.CLOSED) {
        const error = new Error('Listener unexpectedly disconnected')
        error.code = 'EDISCONNECT'
        observer.error(error)
      } else if (es.readyState === EventSource.CONNECTING) {
        emitReconnect()
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
      observer.complete()
      unsubscribe()
    }

    function unsubscribe() {
      listenFor.forEach(type => es.removeEventListener(type, onMessage, false))
      es.removeEventListener('error', onError, false)
      es.removeEventListener('channelError', onChannelError, false)
      es.removeEventListener('disconnect', onDisconnect, false)
      es.close()
    }

    function emitReconnect() {
      if (shouldEmitReconnect) {
        observer.next({type: 'reconnect'})
      }
    }

    return unsubscribe
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
