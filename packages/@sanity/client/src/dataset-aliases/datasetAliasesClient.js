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
    validate.dataset(name)
    return this._modify('PATCH', `${name}/unlink`, {}, true)
  },

  delete(name) {
    return this._modify('DELETE', name)
  },

  list() {
    return this.request({uri: '/aliases'})
  },

  _modify(method, name, body, skipValidation = false) {
    if (!skipValidation) {
      validate.dataset(name)
    }
    return this.request({method, uri: `/aliases/${name}`, body})
  }
})

module.exports = DatasetAliasesClient
