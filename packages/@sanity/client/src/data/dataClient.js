const assign = require('xtend/mutable')
const validators = require('../validators')
const encodeQueryString = require('./encodeQueryString')
const Transaction = require('./transaction')
const Patch = require('./patch')

const mutationDefaults = {returnIds: true}
const getQuerySizeLimit = 1948

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
    validators.validateDocumentId('patch', documentId)
    return new Patch(documentId, operations, this)
  },

  delete(documentId) {
    validators.validateDocumentId('delete', documentId)
    return this.dataRequest('delete', 'm', {delete: {id: documentId}})
  },

  mutate(mutations) {
    return this.dataRequest('mutate', 'm',
      mutations instanceof Patch
        ? mutations.serialize()
        : mutations
    )
  },

  transaction(operations) {
    return new Transaction(operations, this)
  },

  dataRequest(method, endpoint, body) {
    const isMutation = endpoint === 'm'

    // Check if the query string is within a configured threshold,
    // in which case we can use GET. Otherwise, use POST.
    const strQuery = !isMutation && encodeQueryString(body)
    const useGet = !isMutation && strQuery.length < getQuerySizeLimit
    const stringQuery = useGet ? strQuery : ''

    return new Promise(resolve => resolve(validators.hasDataset(this.client.clientConfig)))
      .then(dataset => {
        return this.client.request({
          method: useGet ? 'GET' : 'POST',
          uri: `/data/${endpoint}/${dataset}${stringQuery}`,
          json: useGet ? true : body,
          query: isMutation && mutationDefaults
        })
      })
  },

  _create(doc, op) {
    const dataset = validators.hasDataset(this.client.clientConfig)
    const mutation = {[op]: assign({}, doc, {$id: doc.$id || `${dataset}:`})}
    return this.dataRequest(op, 'm', mutation).then(res => ({
      transactionId: res.transactionId,
      documentId: res.docIds[0]
    }))
  }
})

module.exports = DataClient
