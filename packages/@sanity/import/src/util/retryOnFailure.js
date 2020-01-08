/* eslint-disable no-await-in-loop, max-depth, consistent-return */
const debug = require('debug')('sanity:import')
const {defaults} = require('lodash')

module.exports = async function retryOnFailure(op, opts = {}) {
  const options = defaults({}, opts, {delay: 150, maxTries: 3, isRetriable: () => true})

  for (let attempt = 1; attempt <= options.maxTries; attempt++) {
    try {
      return await op()
    } catch (err) {
      if (!options.isRetriable(err)) {
        debug('Encountered error which is not retriable, giving up')
        throw err
      }

      if (attempt === options.maxTries) {
        debug('Error encountered, max retries hit - giving up (attempt #%d)', attempt)
        throw err
      } else {
        const ms = options.delay * attempt
        debug('Error encountered, waiting %d ms before retrying (attempt #%d)', ms, attempt)
        debug('Error details: %s', err.message)
        await delay(ms)
      }
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
