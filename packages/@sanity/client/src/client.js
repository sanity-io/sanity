import pify from 'pify'
import httpRequest from './httpRequest'
import gradient from '@sanity/gradient-client'
import validators from './validators'

const allowedEvents = ['request']
const defaultConfig = {
  baseUrl: 'https://api.sanity.io'
}

const verifyEvent = (event, handler) => {
  if (allowedEvents.indexOf(event) === -1) {
    throw new Error(`Unknown event type "${event}"`)
  }

  if (typeof handler !== 'function') {
    throw new Error('Event handler must be a function')
  }
}

const initConfig = (config, prevConfig = {}) => {
  const newConfig = {...defaultConfig, ...prevConfig, ...config}
  if (!newConfig.projectId) {
    throw new Error('Configuration must contain `projectId`')
  }

  if (!/^\d/.test(newConfig.projectId)) {
    throw new Error('`projectId` must start with a number')
  }

  if (!config.url) {
    newConfig.url = `${newConfig.baseUrl}/${newConfig.projectId}/v1`
  }

  return newConfig
}

const getGradientConfig = config => ({
  url: `${config.url}/data`,
  dataset: config.dataset,
  token: config.token
})

class SanityClient {
  constructor(config = defaultConfig) {
    this.clientConfig = initConfig(config)
    const client = this.gradientClient = gradient(getGradientConfig(this.clientConfig))

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
    if (typeof newConfig === 'undefined') {
      return this.clientConfig
    }

    this.clientConfig = initConfig(newConfig, this.clientConfig)
    const gradientConfig = getGradientConfig(this.clientConfig)
    return this.gradientClient.setConfig(gradientConfig) && this
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
    const handlers = this.eventHandlers[event] || []
    return handlers.length
      ? Promise.all(handlers.map(handler => handler(...args)))
      : Promise.resolve()
  }

  dataRequest(method, ...args) {
    return this.emit('request', method, ...args)
      .then(() => this.gradient[method](...args))
  }

  fetch(query, params) {
    return this.dataRequest('fetch', query, params)
  }

  update(documentId, patch, opts) {
    return this.dataRequest('update', documentId, patch, opts)
  }

  create(doc, opts) {
    return this.dataRequest('create', doc, opts)
  }

  delete(documentId, opts) {
    return this.dataRequest('delete', documentId, opts)
  }

  modifyDataset(method, name) {
    validators.dataset(name)

    return httpRequest({
      method,
      uri: `${this.clientConfig.url}/datasets/${name}`,
      json: true
    })
  }

  createDataset(name) {
    return this.modifyDataset('PUT', name)
  }

  deleteDataset(name) {
    return this.modifyDataset('DELETE', name)
  }
}

function createClient(config) {
  return new SanityClient(config)
}

export default createClient
