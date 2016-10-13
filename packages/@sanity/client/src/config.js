const assign = require('xtend/mutable')
const validate = require('./validators')

const defaultConfig = exports.defaultConfig = {
  apiHost: 'https://api.sanity.io',
  useProjectHostname: true
}

exports.initConfig = (config, prevConfig) => {
  const newConfig = assign({}, defaultConfig, prevConfig, config)
  const projectBased = newConfig.useProjectHostname

  if (typeof Promise === 'undefined') {
    // @todo add help url?
    throw new Error('No native `Promise`-implementation found, polyfill needed')
  }

  if (projectBased && !newConfig.projectId) {
    throw new Error('Configuration must contain `projectId`')
  }

  if (projectBased) {
    validate.projectId(newConfig.projectId)
  }

  if (newConfig.dataset) {
    validate.dataset(newConfig.dataset)
  }

  const hostParts = newConfig.apiHost.split('://', 2)
  const protocol = hostParts[0]
  const host = hostParts[1]

  if (newConfig.useProjectHostname) {
    newConfig.url = `${protocol}://${newConfig.projectId}.${host}/v1`
  } else {
    newConfig.url = `${newConfig.apiHost}/v1`
  }

  return newConfig
}
