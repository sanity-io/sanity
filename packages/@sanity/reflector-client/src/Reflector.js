/* global window, navigator */

import getIt from 'get-it'
import getItJsonResponse from 'get-it/lib/middleware/jsonResponse'
import getItPromise from 'get-it/lib/middleware/promise'
import Observable from '@sanity/observable/minimal'

const EventSource = typeof window !== 'undefined' && window.EventSource
? window.EventSource // Native browser EventSource
: require('@sanity/eventsource') // Node.js, IE etc

function parseEvent(event) {
  try {
    return (event.data && JSON.parse(event.data)) || {}
  } catch (err) {
    return err
  }
}
export default class Reflector {
  constructor(sanityClient) {
    this.sanityClient = sanityClient
    this.request = getIt([
      getItJsonResponse(),
      getItPromise()
    ])
  }

  listen(channel) {
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
        return event instanceof Error
          ? observer.error(event)
          : observer.next(event)
      }

      function unsubscribe() {
        es.removeEventListener('message', onMessage, false)
        es.close()
      }

      return unsubscribe
    })
  }

  send(channel, message) {
    const url = this.sanityClient.getUrl(`presence/send/${channel}`)

    let headers = {}
    const {token} = this.sanityClient.clientConfig
    if (token) {
      headers = {
        Authorization: `Bearer ${token}`
      }
    }

    return this.request({
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(message)
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
