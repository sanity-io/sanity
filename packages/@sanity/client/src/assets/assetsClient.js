const assign = require('object-assign')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

const ASSET_TYPES_TO_ENDPOINT = {
  image: 'images',
  file: 'files'
}

assign(AssetsClient.prototype, {
  upload(assetType, body, options = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)
    const headers = ('contentType' in options)
      ? {'Content-Type': options.contentType}
      : {}

    const assetEndpointSegment = ASSET_TYPES_TO_ENDPOINT[assetType]
    const query = options.label ? {label: options.label} : {}
    const url = `/assets/${assetEndpointSegment}/${dataset}`

    return this.client.requestObservable({
      method: 'POST',
      timeout: 0,
      query,
      headers,
      uri: url,
      body
    })
  }
})

module.exports = AssetsClient
