const assign = require('object-assign')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

assign(AssetsClient.prototype, {
  upload(assetType, body, options = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)
    const assetEndpoint = assetType === 'image' ? 'images' : 'files'

    return this.client.requestObservable({
      method: 'POST',
      timeout: options.timeout || 0,
      query: options.label ? {label: options.label} : {},
      uri: `/assets/${assetEndpoint}/${dataset}`,
      headers: options.contentType ? {'Content-Type': options.contentType} : {},
      body
    })
  }
})

module.exports = AssetsClient
