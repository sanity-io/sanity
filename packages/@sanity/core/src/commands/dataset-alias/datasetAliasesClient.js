const validateAlias = require('../../actions/dataset-alias/validateDatasetAliasName')

function list(client) {
  return client.request({uri: '/aliases'})
}

function create(client, name, options) {
  return modify(client, 'PUT', name, options)
}

function modify(client, method, name, body) {
  return client.request({method, uri: `/aliases/${name}`, body})
}

function update(client, name, options) {
  return modify(client, 'PATCH', name, options)
}

function unlink(client, name) {
  validateAlias(name)
  return modify(client, 'PATCH', `${name}/unlink`, {}, true)
}

function remove(client, name) {
  return modify(client, 'DELETE', name)
}

exports.list = list
exports.create = create
exports.unlink = unlink
exports.update = update
exports.remove = remove
