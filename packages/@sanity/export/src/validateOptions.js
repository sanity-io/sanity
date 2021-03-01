const defaults = require('lodash/defaults')

const clientMethods = ['getUrl', 'config']
const booleanFlags = ['assets', 'raw', 'compress', 'drafts']
const exportDefaults = {
  compress: true,
  drafts: true,
  assets: true,
  raw: false,
}

function validateOptions(opts) {
  const options = defaults({}, opts, exportDefaults)

  if (typeof options.dataset !== 'string' || options.dataset.length < 1) {
    throw new Error(`options.dataset must be a valid dataset name`)
  }

  if (options.onProgress && typeof options.onProgress !== 'function') {
    throw new Error(`options.onProgress must be a function`)
  }

  if (!options.client) {
    throw new Error('`options.client` must be set to an instance of @sanity/client')
  }

  const missing = clientMethods.find((key) => typeof options.client[key] !== 'function')
  if (missing) {
    throw new Error(
      `\`options.client\` is not a valid @sanity/client instance - no "${missing}" method found`
    )
  }

  const clientConfig = options.client.config()
  if (!clientConfig.token) {
    throw new Error('Client is not instantiated with a `token`')
  }

  booleanFlags.forEach((flag) => {
    if (typeof options[flag] !== 'boolean') {
      throw new Error(`Flag ${flag} must be a boolean (true/false)`)
    }
  })

  if (!options.outputPath) {
    throw new Error('outputPath must be specified (- for stdout)')
  }

  if (options.assetConcurrency && (options.assetConcurrency < 1 || options.assetConcurrency > 24)) {
    throw new Error('`assetConcurrency` must be between 1 and 24')
  }

  return options
}

module.exports = validateOptions
