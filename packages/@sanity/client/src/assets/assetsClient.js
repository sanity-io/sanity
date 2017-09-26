const assign = require('object-assign')
const queryString = require('../http/queryString')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

function toPromise(observable) {
  return observable.filter(event => event.type === 'response')
    .map(event => event.body)
    .toPromise()
}

function optionsFromFile(opts, file) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }

  return assign({
    filename: opts.preserveFilename === false ? undefined : file.name,
    contentType: file.type
  }, opts)
}

assign(AssetsClient.prototype, {
  upload(assetType, body, opts = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)
    const assetEndpoint = assetType === 'image' ? 'images' : 'files'
    const options = optionsFromFile(opts, body)
    const {id, label, filename, meta} = options
    const query = {id, label, filename, meta}

    const observable = this.client._requestObservable({
      method: 'POST',
      timeout: options.timeout || 0,
      uri: `/assets/${assetEndpoint}/${dataset}`,
      headers: options.contentType ? {'Content-Type': options.contentType} : {},
      query,
      body
    })

    return this.client.isPromiseAPI()
      ? toPromise(observable).then(response => response.document)
      : observable
  },

  delete(type, id) {
    let assetType = type
    let docId = id

    // We could be passing an entire asset document instead of an ID
    if (type._type) {
      assetType = type._type.replace(/(^sanity\.|Asset$)/g, '')
      docId = type._id
    }

    const dataset = validators.hasDataset(this.client.clientConfig)
    validators.validateAssetType(assetType)
    validators.validateDocumentId('delete', docId)

    const assetEndpoint = assetType === 'image' ? 'images' : 'files'
    return this.client.request({
      method: 'DELETE',
      uri: `/assets/${assetEndpoint}/${dataset}/${docId}`
    })
  },

  getImageUrl(ref, query) {
    const id = ref._ref || ref
    if (typeof id !== 'string') {
      throw new Error(
        'getImageUrl() needs either an object with a _ref, or a string with an asset document ID'
      )
    }

    if (!/^image-[A-Za-z0-9]+-\d+x\d+-[a-z]{1,5}$/.test(id)) {
      throw new Error(
        `Unsupported asset ID "${id}". URL generation only works for auto-generated IDs.`
      )
    }

    const [, assetId, size, format] = id.split('-')

    validators.hasDataset(this.client.clientConfig)
    const {projectId, dataset} = this.client.clientConfig
    const qs = query ? queryString(query) : ''
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${size}.${format}${qs}`
  }
})

module.exports = AssetsClient
