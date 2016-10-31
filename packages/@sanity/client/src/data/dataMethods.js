const assign = require('xtend/mutable')
const validators = require('../validators')
const encodeQueryString = require('./encodeQueryString')
const Transaction = require('./transaction')
const Patch = require('./patch')
const listen = require('./listen')

const getMutationQuery = options => assign(
  // Always return IDs
  {returnIDs: true},

  // Allow user to disable returning documents
  options.returnDocuments === false ? {} : {returnDocuments: true}
)

const getQuerySizeLimit = 1948

module.exports = {
  listen: listen,

  fetch(query, params) {
    return this.dataRequest('query', {query, params}).then(res => res.result || [])
  },

  getDocument(id) {
    return this.request({
      uri: `/data/doc/${id}`,
      json: true
    }).then(res => res.documents && res.documents[0])
  },

  create(doc, options) {
    return this._create(doc, 'create', options)
  },

  createIfNotExists(doc, options) {
    return this._create(doc, 'createIfNotExists', options)
  },

  createOrReplace(doc, options) {
    return this._create(doc, 'createOrReplace', options)
  },

  patch(selector, operations) {
    return new Patch(selector, operations, this)
  },

  delete(documentId) {
    validators.validateDocumentId('delete', documentId)
    return this.dataRequest('mutate', {mutations: [{delete: {id: documentId}}]})
  },

  mutate(mutations, options) {
    const mut = mutations instanceof Patch
      ? mutations.serialize()
      : mutations
    const muts = Array.isArray(mut) ? mut : [mut]

    return this.dataRequest('mutate', {mutations: muts}, options)
  },

  transaction(operations) {
    return new Transaction(operations, this)
  },

  dataRequest(endpoint, body, options = {}) {
    const isMutation = endpoint === 'mutate'

    // Check if the query string is within a configured threshold,
    // in which case we can use GET. Otherwise, use POST.
    const strQuery = !isMutation && encodeQueryString(body)
    const useGet = !isMutation && strQuery.length < getQuerySizeLimit
    const stringQuery = useGet ? strQuery : ''
    const returnFirst = options.returnFirst

    return validators.promise.hasDataset(this.clientConfig)
      .then(dataset => this.request({
        method: useGet ? 'GET' : 'POST',
        uri: `/data/${endpoint}/${dataset}${stringQuery}`,
        json: true,
        body: useGet ? undefined : body,
        query: isMutation && getMutationQuery(options)
      }))
      .then(res => {
        if (!isMutation) {
          return res
        }

        const results = res.results || []
        if (options.returnDocuments) {
          return returnFirst
            ? results[0] && results[0].document
            : results.map(mut => mut.document)
        }

        // Only return IDs
        const key = returnFirst ? 'documentId' : 'documentIds'
        const ids = returnFirst ? results[0] && results[0].id : results.map(mut => mut.id)
        return {transactionId: res.transactionID, [key]: ids}
      })
  },

  _create(doc, op, options = {}) {
    const dataset = validators.hasDataset(this.clientConfig)
    const mutation = {[op]: assign({}, doc, {_id: doc._id || `${dataset}/`})}
    const opts = assign({returnFirst: true, returnDocuments: true}, options)
    return this.dataRequest('mutate', {mutations: [mutation]}, opts)
  }
}
