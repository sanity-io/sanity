import pify from 'pify'
import gradient from '@sanity/gradient-client'

const allowedEvents = ['request']

const verifyEvent = (event, handler) => {
  if (allowedEvents.indexOf(event) === -1) {
    throw new Error(`Unknown event type "${event}"`)
  }

  if (typeof handler !== 'function') {
    throw new Error('Event handler must be a function')
  }
}

class SanityClient {
  constructor(config = {}) {
    const client = this.client = gradient(config)

    this.eventHandlers = allowedEvents.reduce((handlers, event) => {
      handlers[event] = []
      return handlers
    }, {})

    this.gradient = pify({
      fetch: client.fetch.bind(client),
      update: client.update.bind(client),
      create: client.create.bind(client),
      delete: client.delete.bind(client)
    })
  }

  config(newConfig) {
    return typeof newConfig === 'undefined'
      ? this.client.getConfig()
      : this.client.setConfig(newConfig) && this
  }

  on(event, handler) {
    verifyEvent(event, handler)
    this.eventHandlers[event].push(handler)
    return this
  }

  removeListener(event, handler) {
    verifyEvent(event, handler)
    const handlerIndex = this.eventHandlers[event].indexOf(handler)
    if (handlerIndex === -1) {
      throw new Error('Event handler given is not registered for this event')
    }

    this.eventHandlers[event].splice(handlerIndex, 1)
    return this
  }

  emit(event, ...args) {
    return Promise.all(
      (this.eventHandlers[event] || []).map(handler => handler(...args))
    )
  }

  request(method, ...args) {
    return this.emit('request', method, ...args)
      .then(() => this.gradient[method](...args))
  }

  fetch(query, params) {
    return this.request('fetch', query, params)
  }

  update(documentId, patch, opts) {
    return this.request('update', documentId, patch, opts)
  }

  create(doc, opts) {
    return this.request('create', doc, opts)
  }

  delete(documentId, opts) {
    return this.request('delete', documentId, opts)
  }
}

function createClient(config) {
  return new SanityClient(config)
}

export default createClient
