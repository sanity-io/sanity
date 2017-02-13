const assign = require('object-assign')
const validators = require('../validators')
const getSelection = require('../util/getSelection')
const encodeQueryString = require('./encodeQueryString')
const Transaction = require('./transaction')
const Patch = require('./patch')
const listen = require('./listen')

const excludeFalsey = (param, defValue) => {
  const value = typeof param === 'undefined' ? defValue : param
  return param === false ? undefined : value
}

const getMutationQuery = (options = {}) => {
  return {
    returnIds: true,
    returnDocuments: excludeFalsey(options.returnDocuments, true),
    visibility: options.visibility || 'sync'
  }
}

const isResponse = event => event.type === 'response'
const getBody = event => event.body

const toPromise = observable => observable.toPromise()

const getQuerySizeLimit = 1948

module.exports = {
  listen: listen,

  getDataUrl(endpoint, uri) {
    const projectId = this.clientConfig.projectId
    return (this.clientConfig.gradientMode
      ? `/${endpoint}/${projectId}/${uri}`
      : `/data/${endpoint}/${uri}`
    ).replace(/\/($|\?)/, '$1')
  },

  fetch(query, params) {
    const observable = this._dataRequest('query', {query, params}).map(res => res.result || [])
    return this.isPromiseAPI()
      ? toPromise(observable)
      : observable
  },

  getDocument(id) {
    const observable = this._requestObservable({
      uri: this.getDataUrl('doc', id),
      json: true
    })
      .filter(isResponse)
      .map(event => event.body.documents && event.body.documents[0])

    return this.isPromiseAPI()
      ? toPromise(observable)
      : observable

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

  delete(selection, options) {
    return this.dataRequest('mutate', {
      mutations: [{delete: getSelection(selection)}]
    }, options)
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
    const request = this._dataRequest(endpoint, body, options)

    return this.isPromiseAPI()
      ? toPromise(request)
      : request
  },

  _dataRequest(endpoint, body, options = {}) {
    const isMutation = endpoint === 'mutate'

    // Check if the query string is within a configured threshold,
    // in which case we can use GET. Otherwise, use POST.
    const strQuery = !isMutation && encodeQueryString(body)
    const useGet = !isMutation && strQuery.length < getQuerySizeLimit
    const stringQuery = useGet ? strQuery : ''
    const returnFirst = options.returnFirst

    const dataset = validators.hasDataset(this.clientConfig)
    return this._requestObservable({
      method: useGet ? 'GET' : 'POST',
      uri: this.getDataUrl(endpoint, `${dataset}${stringQuery}`),
      json: true,
      body: useGet ? undefined : body,
      query: isMutation && getMutationQuery(options)
    })
      .filter(isResponse)
      .map(getBody)
      .map(res => {
        if (!isMutation) {
          return res
        }

        // Should we return documents?
        const results = res.results || []
        if (options.returnDocuments) {
          return returnFirst
            ? results[0] && results[0].document
            : results.map(mut => mut.document)
        }

        // Return a reduced subset
        const key = returnFirst ? 'documentId' : 'documentIds'
        const ids = returnFirst ? results[0] && results[0].id : results.map(mut => mut.id)
        return {
          transactionId: res.transactionId,
          results: results,
          [key]: ids
        }
      })
  },

  _create(doc, op, options = {}) {
    const dataset = validators.hasDataset(this.clientConfig)
    const mutation = {[op]: assign({}, doc, {_id: doc._id || `${dataset}.`})}
    const opts = assign({returnFirst: true, returnDocuments: true}, options)
    return this.dataRequest('mutate', {mutations: [mutation]}, opts)
  }
}
