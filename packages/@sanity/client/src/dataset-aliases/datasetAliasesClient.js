const assign = require('object-assign')
const validate = require('../validators')

function DatasetAliasesClient(client) {
  this.request = client.request.bind(client)
}

assign(DatasetAliasesClient.prototype, {
  create(name, options) {
    return this._modify('PUT', name, options)
  },

  update(name, options) {
    return this._modify('PATCH', name, options)
  },

  unlink(name) {
    return this._modify('PATCH', `${name}/unlink`)
  },

  delete(name) {
    return this._modify('DELETE', name)
  },

  list() {
    return this.request({uri: '/aliases'})
  },

  _modify(method, name, body) {
    validate.dataset(name)
    return this.request({method, uri: `/aliases/${name}`, body})
  }
})

module.exports = DatasetAliasesClient
