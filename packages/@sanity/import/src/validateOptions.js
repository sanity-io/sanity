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

  if (!input || (typeof input.pipe !== 'function' && !Array.isArray(input))) {
    throw new Error('Stream does not seem to be a readable stream or an array')
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

  return options
}

module.exports = validateOptions
