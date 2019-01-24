/* global window, navigator */

import {Observable} from 'rxjs'
import WebSocketImpl from 'isomorphic-ws'

const MODE_WEBSOCKET = 'ws'
const MODE_EVENTSOURCE = 'es'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
const EventSource =
  isBrowser && window.EventSource
    ? window.EventSource // Native browser EventSource
    : require('@sanity/eventsource') // Node.js, IE etc

function parseEvent(event) {
  try {
    return (event.data && JSON.parse(event.data)) || {}
  } catch (err) {
    return err
  }
}

class Reflector {
  constructor(sanityClient) {
    this.sanityClient = sanityClient
    this.hasToken = Boolean(sanityClient.config().token)
    this.mode = (isBrowser && this.hasToken) || !WebSocketImpl ? MODE_EVENTSOURCE : MODE_EVENTSOURCE
    this.sockets = {}
  }

  listen(channel) {
    return this.mode === MODE_WEBSOCKET ? this.listenWs(channel) : this.listenEs(channel)
  }

  listenWs(channel) {
    const {token} = this.sanityClient.config()

    const options = {}
    if (this.hasToken) {
      options.headers = {Authorization: `Bearer ${token}`}
    }

    const url = this.sanityClient.getUrl(`presence/socket/${channel}`).replace(/^http/, 'ws')
    return new Observable(observer => {
      const ws = new WebSocketImpl(url, options)
      ws.addEventListener('message', onMessage, false)
      ws.addEventListener('open', onOpen, false)
      ws.addEventListener('close', onClose, false)

      function onMessage(evt) {
        const event = parseEvent(evt)
        return event instanceof Error ? observer.error(event) : observer.next(event)
      }

      function unsubscribe() {
        ws.removeEventListener('message', onMessage, false)
        ws.removeEventListener('open', onOpen, false)
        ws.removeEventListener('close', onClose, false)
        ws.close()
        delete this.sockets[channel]
      }

      function onOpen() {
        this.sockets[channel] = ws
      }

      function onClose() {
        delete this.sockets[channel]
      }

      return unsubscribe
    })
  }

  listenEs(channel) {
    const {token, withCredentials} = this.sanityClient.clientConfig

    const esOptions = {}
    if (token || withCredentials) {
      esOptions.withCredentials = true
    }

    if (token) {
      esOptions.headers = {
        Authorization: `Bearer ${token}`
      }
    }

    const url = this.sanityClient.getUrl(`presence/listen/${channel}`)
    return new Observable(observer => {
      const es = new EventSource(url, esOptions)
      es.addEventListener('message', onMessage, false)

      function onMessage(evt) {
        const event = parseEvent(evt)
        return event instanceof Error ? observer.error(event) : observer.next(event)
      }

      function unsubscribe() {
        es.removeEventListener('message', onMessage, false)
        es.close()
      }

      return unsubscribe
    })
  }

  send(channel, message) {
    if (this.mode === MODE_WEBSOCKET && this.sockets[channel]) {
      return Promise.resolve(this.sockets[channel].send(JSON.stringify(message)))
    }

    return this.sanityClient.request({
      url: `presence/send/${channel}`,
      method: 'POST',
      body: message
    })
  }

  // Sends a message using the beacon api which in some browsers lets us send a little bit of
  // data while the window is closing. Returns true if the message was successfully submitted,
  // false if it failed or if status is unknown.
  sendBeacon(channel, message) {
    if (typeof navigator == 'undefined' || typeof navigator.sendBeacon != 'function') {
      // If sendBeacon is not supported, just try to send it the old fashioned way
      this.send(channel, message)
      return false
    }
    const url = this.sanityClient.getUrl(`presence/send/${channel}`)
    return navigator.sendBeacon(url, JSON.stringify(message))
  }

  // Create a connection to a specific reflector channel
  connect(channel) {
    return {
      listen: () => this.listen(channel),
      send: message => this.send(channel, message),
      sendBeacon: message => this.sendBeacon(channel, message)
    }
  }
}

// eslint-disable-next-line import/no-commonjs
module.exports = Reflector
