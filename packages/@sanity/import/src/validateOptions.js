const fse = require('fs-extra')
const noop = require('lodash/noop')
const defaults = require('lodash/defaults')

const clientMethods = ['fetch', 'transaction', 'config']
const allowedOperations = ['create', 'createIfNotExists', 'createOrReplace']
const defaultOperation = allowedOperations[0]

function validateOptions(input, opts) {
  const options = defaults({}, opts, {
    operation: defaultOperation,
    onProgress: noop
  })

  if (!isValidInput(input)) {
    throw new Error(
      'Stream does not seem to be a readable stream, an array or a path to a directory'
    )
  }

  if (!options.client) {
    throw new Error('`options.client` must be set to an instance of @sanity/client')
  }

  const missing = clientMethods.find(key => typeof options.client[key] !== 'function')

  if (missing) {
    throw new Error(
      `\`options.client\` is not a valid @sanity/client instance - no "${missing}" method found`
    )
  }

  const clientConfig = options.client.config()
  if (!clientConfig.token) {
    throw new Error('Client is not instantiated with a `token`')
  }

  if (!allowedOperations.includes(options.operation)) {
    throw new Error(`Operation "${options.operation}" is not supported`)
  }

  if (options.concurrency && options.concurrency > 24) {
    throw new Error('`concurrency` must be <= 24')
  }

  return options
}

function isValidInput(input) {
  if (!input) {
    return false
  }

  if (typeof input.pipe === 'function') {
    return true
  }

  if (Array.isArray(input)) {
    return true
  }

  if (typeof input === 'string' && isDirectory(input)) {
    return true
  }

  return false
}

function isDirectory(path) {
  try {
    // eslint-disable-next-line no-sync
    const stats = fse.statSync(path)
    return stats.isDirectory()
  } catch (err) {
    return false
  }
}

module.exports = validateOptions
