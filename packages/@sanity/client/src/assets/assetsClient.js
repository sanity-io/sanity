const assign = require('xtend/mutable')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

const ASSET_TYPES_TO_ENDPOINT = {
  image: 'images',
  file: 'files'
}

assign(AssetsClient.prototype, {
  upload(assetType, file, options = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)

    const customHeaders = ('contentType' in options)
      ? {'Content-Type': options.contentType}
      : {}

    const assetEndpointSegment = ASSET_TYPES_TO_ENDPOINT[assetType]
    const query = options.label ? `?label=${encodeURIComponent(options.label)}` : ''
    const uri = `/assets/${assetEndpointSegment}/${dataset}${query}`

    return this.client.requestObservable({
      method: 'POST',
      headers: assign({
        Accept: 'application/json',
      }, customHeaders),
      uri: uri,
      body: file,
      json: false,
      timeout: 0
    }).map(event => {
      if (event.type !== 'response') {
        return event
      }
      return assign({}, event, {
        body: JSON.parse(event.body)
      })
    })
  }
})

module.exports = AssetsClient
