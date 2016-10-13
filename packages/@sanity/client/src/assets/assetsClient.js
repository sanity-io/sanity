const assign = require('xtend/mutable')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

assign(AssetsClient.prototype, {
  upload(assetType, file, options = {}) {
    validators.validateAssetType(assetType)

    const dataset = validators.hasDataset(this.client.clientConfig)

    const customHeaders = ('contentType' in options)
      ? {'Content-Type': options.contentType}
      : {}

    return this.client.requestObservable({
      method: 'POST',
      headers: assign({
        Accept: 'application/json',
      }, customHeaders),
      uri: `/assets/${assetType}/${dataset}`,
      body: file,
      json: false,
      timeout: 0
    })
      .map(event => {
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
