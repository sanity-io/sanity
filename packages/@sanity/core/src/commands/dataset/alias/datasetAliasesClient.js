import validateAlias from '../../../actions/dataset/alias/validateDatasetAliasName'

export const ALIAS_PREFIX = '~'

export function listAliases(client) {
  return client.request({uri: '/aliases'})
}

export function createAlias(client, name, datasetName) {
  return modify(client, 'PUT', name, datasetName ? {datasetName} : null)
}

export function modify(client, method, name, body) {
  return client.request({method, uri: `/aliases/${name}`, body})
}

export function updateAlias(client, name, datasetName) {
  return modify(client, 'PATCH', name, datasetName ? {datasetName} : null)
}

export function unlinkAlias(client, name) {
  validateAlias(name)
  return modify(client, 'PATCH', `${name}/unlink`, {}, true)
}

export function removeAlias(client, name) {
  return modify(client, 'DELETE', name)
}
