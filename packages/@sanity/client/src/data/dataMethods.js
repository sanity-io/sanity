const assign = require('object-assign')
const {filter} = require('@sanity/observable/operators/filter')
const {map} = require('@sanity/observable/operators/map')
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
    visibility: options.visibility || 'sync',
  }
}

const isResponse = (event) => event.type === 'response'
const getBody = (event) => event.body

const indexBy = (docs, attr) =>
  docs.reduce((indexed, doc) => {
    indexed[attr(doc)] = doc
    return indexed
  }, Object.create(null))

const toPromise = (observable) => observable.toPromise()

const getQuerySizeLimit = 11264

module.exports = {
  listen: listen,

  getDataUrl(operation, path) {
    const config = this.clientConfig
    const catalog = config.gradientMode ? config.namespace : validators.hasDataset(config)
    const baseUri = `/${operation}/${catalog}`
    const uri = path ? `${baseUri}/${path}` : baseUri
    return (this.clientConfig.gradientMode ? uri : `/data${uri}`).replace(/\/($|\?)/, '$1')
  },

  fetch(query, params, options = {}) {
    const mapResponse = options.filterResponse === false ? (res) => res : (res) => res.result

    const observable = this._dataRequest('query', {query, params}, options).pipe(map(mapResponse))
    return this.isPromiseAPI() ? toPromise(observable) : observable
  },

  getDocument(id) {
    const options = {uri: this.getDataUrl('doc', id), json: true}
    const observable = this._requestObservable(options).pipe(
      filter(isResponse),
      map((event) => event.body.documents && event.body.documents[0])
    )

    return this.isPromiseAPI() ? toPromise(observable) : observable
  },

  getDocuments(ids) {
    const options = {uri: this.getDataUrl('doc', ids.join(',')), json: true}
    const observable = this._requestObservable(options).pipe(
      filter(isResponse),
      map((event) => {
        const indexed = indexBy(event.body.documents || [], (doc) => doc._id)
        return ids.map((id) => indexed[id] || null)
      })
    )

    return this.isPromiseAPI() ? toPromise(observable) : observable
  },

  create(doc, options) {
    return this._create(doc, 'create', options)
  },

  createIfNotExists(doc, options) {
    validators.requireDocumentId('createIfNotExists', doc)
    return this._create(doc, 'createIfNotExists', options)
  },

  createOrReplace(doc, options) {
    validators.requireDocumentId('createOrReplace', doc)
    return this._create(doc, 'createOrReplace', options)
  },

  patch(selector, operations) {
    return new Patch(selector, operations, this)
  },

  delete(selection, options) {
    return this.dataRequest('mutate', {mutations: [{delete: getSelection(selection)}]}, options)
  },

  mutate(mutations, options) {
    const mut =
      mutations instanceof Patch || mutations instanceof Transaction
        ? mutations.serialize()
        : mutations

    const muts = Array.isArray(mut) ? mut : [mut]
    const transactionId = options && options.transactionId
    return this.dataRequest('mutate', {mutations: muts, transactionId}, options)
  },

  transaction(operations) {
    return new Transaction(operations, this)
  },

  dataRequest(endpoint, body, options = {}) {
    const request = this._dataRequest(endpoint, body, options)

    return this.isPromiseAPI() ? toPromise(request) : request
  },

  _dataRequest(endpoint, body, options = {}) {
    const isMutation = endpoint === 'mutate'

    // Check if the query string is within a configured threshold,
    // in which case we can use GET. Otherwise, use POST.
    const strQuery = !isMutation && encodeQueryString(body)
    const useGet = !isMutation && strQuery.length < getQuerySizeLimit
    const stringQuery = useGet ? strQuery : ''
    const returnFirst = options.returnFirst
    const {timeout, token} = options

    const uri = this.getDataUrl(endpoint, stringQuery)

    const reqOptions = {
      method: useGet ? 'GET' : 'POST',
      uri: uri,
      json: true,
      body: useGet ? undefined : body,
      query: isMutation && getMutationQuery(options),
      timeout,
      token,
    }

    return this._requestObservable(reqOptions).pipe(
      filter(isResponse),
      map(getBody),
      map((res) => {
        if (!isMutation) {
          return res
        }

        // Should we return documents?
        const results = res.results || []
        if (options.returnDocuments) {
          return returnFirst
            ? results[0] && results[0].document
            : results.map((mut) => mut.document)
        }

        // Return a reduced subset
        const key = returnFirst ? 'documentId' : 'documentIds'
        const ids = returnFirst ? results[0] && results[0].id : results.map((mut) => mut.id)
        return {
          transactionId: res.transactionId,
          results: results,
          [key]: ids,
        }
      })
    )
  },

  _create(doc, op, options = {}) {
    const mutation = {[op]: doc}
    const opts = assign({returnFirst: true, returnDocuments: true}, options)
    return this.dataRequest('mutate', {mutations: [mutation]}, opts)
  },
}
