const assign = require('xtend/mutable')
const Patch = require('./data/patch')
const Transaction = require('./data/transaction')
const DataClient = require('./data/dataClient')
const DatasetsClient = require('./datasets/datasetsClient')
const ProjectsClient = require('./projects/projectsClient')
const UsersClient = require('./projects/usersClient')
const httpRequest = require('./http/request')
const {getRequestOptions} = require('./http/requestOptions')
const {defaultConfig, initConfig} = require('./config')

const allowedEvents = ['request']

const verifyEvent = (event, handler) => {
  if (allowedEvents.indexOf(event) === -1) {
    throw new Error(`Unknown event type "${event}"`)
  }

  if (typeof handler !== 'function') {
    throw new Error('Event handler must be a function')
  }
}

function SanityClient(config = defaultConfig) {
  this.config(config)

  this.data = new DataClient(this)
  this.datasets = new DatasetsClient(this)
  this.projects = new ProjectsClient(this)
  this.users = new UsersClient(this)

  this.eventHandlers = allowedEvents.reduce((handlers, event) => {
    handlers[event] = []
    return handlers
  }, {})
}

assign(SanityClient.prototype, {
  config(newConfig) {
    if (typeof newConfig === 'undefined') {
      return this.clientConfig
    }

    this.clientConfig = initConfig(newConfig, this.clientConfig || {})
    return this
  },

  on(event, handler) {
    verifyEvent(event, handler)
    this.eventHandlers[event].push(handler)
    return this
  },

  removeListener(event, handler) {
    verifyEvent(event, handler)
    const handlerIndex = this.eventHandlers[event].indexOf(handler)
    if (handlerIndex !== -1) {
      this.eventHandlers[event].splice(handlerIndex, 1)
    }

    return this
  },

  emit(event, ...args) {
    const handlers = this.eventHandlers[event]
    const promise = this.clientConfig.promise
    return handlers.length
      ? promise.all(handlers.map(handler => handler(...args)))
      : promise.resolve()
  },

  getUrl(uri) {
    return `${this.clientConfig.url}/${uri.replace(/^\//, '')}`
  },

  request(options) {
    return httpRequest(assign(
      {promise: this.clientConfig.promise},
      getRequestOptions(this.clientConfig),
      options,
      {uri: this.getUrl(options.uri)}
    ))
  }
})

function createClient(config) {
  return new SanityClient(config)
}

createClient.Patch = Patch
createClient.Transaction = Transaction

module.exports = createClient
