const assign = require('object-assign')
const Observable = require('@sanity/observable/minimal')
const encodeQueryString = require('./encodeQueryString')
const pick = require('../util/pick')
const defaults = require('../util/defaults')

const EventSource = typeof window !== 'undefined' && window.EventSource
  ? window.EventSource // Native browser EventSource
  : require('@sanity/eventsource') // Node.js, IE etc

// Temporarily(?) needed because the node eventsource doesn't expose removeEventListener
const removeListener = (evtSrc, evt, handler) => {
  if (evtSrc.removeEventListener) {
    evtSrc.removeEventListener(evt, handler, false)
  } else {
    evtSrc.removeListener(evt, handler)
  }
}

const possibleOptions = ['includePreviousRevision', 'includeResult']
const defaultOptions = {
  includeResult: true
}

module.exports = function listen(query, params, opts = {}) {
  const options = defaults(opts, defaultOptions)
  const listenOpts = pick(options, possibleOptions)
  const qs = encodeQueryString({query, params, options: listenOpts})
  const {url, token} = this.clientConfig

  const authHeaders = {}
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`
  }

  const uri = `${url}${this.getDataUrl('listen', qs)}`
  const listenFor = options.events ? options.events : ['mutation']
  const shouldEmitReconnect = listenFor.indexOf('reconnect') !== -1

  return new Observable(observer => {
    const es = new EventSource(uri, assign(
      {withCredentials: true},
      token ? {headers: authHeaders} : {}
    ))

    es.addEventListener('error', onError, false)
    es.addEventListener('channelError', onChannelError, false)
    es.addEventListener('disconnect', onDisconnect, false)
    listenFor.forEach(type => es.addEventListener(type, onMessage, false))

    function onError() {
      if (es.readyState === EventSource.CLOSED) {
        observer.complete()
      } else if (es.readyState === EventSource.CONNECTING) {
        emitReconnect()
      }
    }

    function onChannelError(err) {
      observer.error(cooerceError(err))
    }

    function onMessage(evt) {
      const event = parseEvent(evt)
      return event instanceof Error
        ? observer.error(event)
        : observer.next(event)
    }

    function onDisconnect(evt) {
      observer.complete()
      unsubscribe()
    }

    function unsubscribe() {
      listenFor.forEach(type => removeListener(es, type, onMessage))
      removeListener(es, 'error', onError)
      removeListener(es, 'channelError', onChannelError)
      removeListener(es, 'disconnect', onDisconnect)
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

  return typeof err.error === 'string'
    ? err.error
    : JSON.stringify(err.error, null, 2)
}
