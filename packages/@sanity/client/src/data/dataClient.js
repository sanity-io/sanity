const assign = require('xtend/mutable')
const Patch = require('./patch')

const mutationDefaults = {returnIds: true}

function DataClient(client) {
  this.client = client
}

assign(DataClient.prototype, {
  fetch(query, params) {
    return this.dataRequest('fetch', 'q', {query, params}).then(res => res.result || [])
  },

  getDocument(id) {
    return this.fetch('*[.$id == %id]', {id}).then(results => results[0])
  },

  create(doc) {
    return this._create(doc, 'create')
  },

  createIfNotExists(doc) {
    return this._create(doc, 'createIfNotExists')
  },

  createOrReplace(doc) {
    return this._create(doc, 'createOrReplace')
  },

  patch(documentId, operations) {
    return new Patch(this, documentId, operations)
  },

  delete(id) {
    return this.dataRequest('delete', 'm', {delete: {id: id}})
  },

  mutate(mutations) {
    return this.dataRequest('mutate', 'm', mutations)
  },

  dataRequest(method, endpoint, body) {
    const query = endpoint === 'm' && mutationDefaults
    return this.client.emit('request', method, body).then(() => {
      const dataset = checkDataset(this.client.clientConfig)
      return this.client.request({
        method: 'POST',
        uri: `/data/${endpoint}/${dataset}`,
        json: body,
        query: query
      })
    })
  },

  _create(doc, op) {
    const dataset = checkDataset(this.clientConfig)
    const mutation = {}
    mutation[op] = assign({}, doc, {$id: doc.$id || `${dataset}:`})
    return this.dataRequest(op, 'm', mutation)
  }
})

function checkDataset(config) {
  if (!config.dataset) {
    throw new Error('`dataset` must be provided to perform queries')
  }

  return config.dataset
}

module.exports = DataClient
