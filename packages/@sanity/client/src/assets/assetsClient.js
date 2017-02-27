const assign = require('object-assign')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

function toPromise(observable) {
  return observable.filter(event => event.type === 'response')
    .map(event => event.body)
    .toPromise()
}

assign(AssetsClient.prototype, {
  upload(assetType, body, options = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)
    const assetEndpoint = assetType === 'image' ? 'images' : 'files'

    const observable = this.client._requestObservable({
      method: 'POST',
      timeout: options.timeout || 0,
      query: options.label ? {label: options.label} : {},
      url: `/assets/${assetEndpoint}/${dataset}`,
      headers: options.contentType ? {'Content-Type': options.contentType} : {},
      body
    })

    return this.client.isPromiseAPI()
      ? toPromise(observable)
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
      url: `/assets/${assetEndpoint}/${dataset}/${docId}`
    })
  }
})

module.exports = AssetsClient
