'use strict'

var _rxjs = require('rxjs')

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i]
    descriptor.enumerable = descriptor.enumerable || false
    descriptor.configurable = true
    if ('value' in descriptor) descriptor.writable = true
    Object.defineProperty(target, descriptor.key, descriptor)
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps)
  if (staticProps) _defineProperties(Constructor, staticProps)
  return Constructor
}

var EventSource =
  typeof window !== 'undefined' && window.EventSource
    ? window.EventSource // Native browser EventSource
    : require('@sanity/eventsource') // Node.js, IE etc

function parseEvent(event) {
  try {
    return (event.data && JSON.parse(event.data)) || {}
  } catch (err) {
    return err
  }
}

var Reflector = /*#__PURE__*/ (function () {
  function Reflector(sanityClient) {
    _classCallCheck(this, Reflector)

    this.sanityClient = sanityClient
  }

  _createClass(Reflector, [
    {
      key: 'listen',
      value: function listen(channel) {
        var _this$sanityClient$cl = this.sanityClient.clientConfig,
          token = _this$sanityClient$cl.token,
          withCredentials = _this$sanityClient$cl.withCredentials
        var esOptions = {}

        if (token || withCredentials) {
          esOptions.withCredentials = true
        }

        if (token) {
          esOptions.headers = {
            Authorization: 'Bearer '.concat(token),
          }
        }

        var url = this.sanityClient.getUrl('presence/listen/'.concat(channel))
        return new _rxjs.Observable(function (observer) {
          var es = new EventSource(url, esOptions)
          es.addEventListener('message', onMessage, false)

          function onMessage(evt) {
            var event = parseEvent(evt)
            return event instanceof Error ? observer.error(event) : observer.next(event)
          }

          function unsubscribe() {
            es.removeEventListener('message', onMessage, false)
            es.close()
          }

          return unsubscribe
        })
      },
    },
    {
      key: 'send',
      value: function send(channel, message) {
        return this.sanityClient.request({
          url: 'presence/send/'.concat(channel),
          method: 'POST',
          body: message,
        })
      }, // Sends a message using the beacon api which in some browsers lets us send a little bit of
      // data while the window is closing. Returns true if the message was successfully submitted,
      // false if it failed or if status is unknown.
    },
    {
      key: 'sendBeacon',
      value: function sendBeacon(channel, message) {
        if (typeof navigator == 'undefined' || typeof navigator.sendBeacon != 'function') {
          // If sendBeacon is not supported, just try to send it the old fashioned way
          this.send(channel, message)
          return false
        }

        var url = this.sanityClient.getUrl('presence/send/'.concat(channel))
        return navigator.sendBeacon(url, JSON.stringify(message))
      }, // Create a connection to a specific reflector channel
    },
    {
      key: 'connect',
      value: function connect(channel) {
        var _this = this

        return {
          listen: function listen() {
            return _this.listen(channel)
          },
          send: function send(message) {
            return _this.send(channel, message)
          },
          sendBeacon: function sendBeacon(message) {
            return _this.sendBeacon(channel, message)
          },
        }
      },
    },
  ])

  return Reflector
})() // eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = Reflector
