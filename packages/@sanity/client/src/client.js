import httpRequest from './httpRequest'
import {dataset as validateDataset} from './validators'
import objectAssign from 'object-assign'

const tokenHeader = 'Sanity-Token'
const projectHeader = 'Sanity-Project-ID'
const mutationDefaults = {returnIds: true}
const allowedEvents = ['request']
const defaultConfig = {
  apiHost: 'https://api.sanity.io',
  useProjectHostname: true
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
  const newConfig = objectAssign({}, defaultConfig, prevConfig, config)
  const projectBased = newConfig.useProjectHostname
  if (projectBased && !newConfig.projectId) {
    throw new Error('Configuration must contain `projectId`')
  }

  if (projectBased && !/^[-a-z0-9]+$/i.test(newConfig.projectId)) {
    throw new Error('`projectId` can only contain only a-z, 0-9 and dashes')
  }

  if (newConfig.dataset) {
    validateDataset(newConfig.dataset)
  }

  const [protocol, host] = newConfig.apiHost.split('://', 2)
  if (newConfig.useProjectHostname) {
    newConfig.url = `${protocol}://${newConfig.projectId}.${host}/v1`
  } else {
    newConfig.url = `${newConfig.apiHost}/v1`
  }

  return newConfig
}

const getReqOptions = config => {
  const headers = {}

  if (config.token) {
    headers[tokenHeader] = config.token
  }

  if (!config.useProjectHostname) {
    headers[projectHeader] = config.projectId
  }

  return {headers, json: true}
}

class SanityClient {
  constructor(config = defaultConfig) {
    this.clientConfig = initConfig(config)

    this.eventHandlers = allowedEvents.reduce((handlers, event) => {
      handlers[event] = []
      return handlers
    }, {})
  }

  config(newConfig) {
    if (typeof newConfig === 'undefined') {
      return this.clientConfig
    }

    this.clientConfig = initConfig(newConfig, this.clientConfig)
    return this
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

  create(doc) {
    const dataset = checkDataset(this.clientConfig)
    const docId = doc.$id || `${dataset}:`
    const creation = objectAssign({}, doc)
    delete creation.$id
    return this.dataRequest('create', 'm', wrapDoc(docId, {$$create: creation}))
  }

  fetch(query, params) {
    return this.dataRequest('fetch', 'q', {query, params})
  }

  update(documentId, patch) {
    return this.dataRequest('update', 'm', wrapDoc(documentId, {$$update: patch}))
  }

  delete(documentId) {
    return this.dataRequest('delete', 'm', wrapDoc(documentId, {$$delete: null}))
  }

  dataRequest(method, endpoint, body) {
    const query = endpoint === 'm' && mutationDefaults
    return this.emit('request', method, body).then(() => {
      const dataset = checkDataset(this.clientConfig)
      return this.request({
        method: 'POST',
        uri: `/data/${endpoint}/${dataset}`,
        json: body,
        query
      })
    })
  }

  modifyDataset(method, name) {
    validateDataset(name)
    return this.request({method, uri: `/datasets/${name}`})
  }

  createDataset(name) {
    return this.modifyDataset('PUT', name)
  }

  deleteDataset(name) {
    return this.modifyDataset('DELETE', name)
  }

  getProjects() {
    return this.request({uri: '/projects'})
  }

  request(options) {
    return httpRequest(objectAssign(
      {},
      getReqOptions(this.clientConfig),
      options,
      {uri: `${this.clientConfig.url}/${options.uri.replace(/^\//, '')}`}
    ))
  }
}

function wrapDoc(id, val) {
  const obj = {}
  obj[id] = val
  return obj
}

function checkDataset(config) {
  if (!config.dataset) {
    throw new Error('`dataset` must be provided to perform queries')
  }

  return config.dataset
}

function createClient(config) {
  return new SanityClient(config)
}

export default createClient
