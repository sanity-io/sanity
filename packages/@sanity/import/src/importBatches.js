const pMap = require('p-map')
const progressStepper = require('./util/progressStepper')
const retryOnFailure = require('./util/retryOnFailure')

const DOCUMENT_IMPORT_CONCURRENCY = 3

async function importBatches(batches, options) {
  const progress = progressStepper(options.onProgress, {
    step: 'Importing documents',
    total: batches.length
  })

  const mapOptions = {concurrency: DOCUMENT_IMPORT_CONCURRENCY}
  const batchSizes = await pMap(batches, importBatch.bind(null, options, progress), mapOptions)

  return batchSizes.reduce((prev, add) => prev + add, 0)
}

function importBatch(options, progress, batch) {
  const {client, operation} = options
  const maxRetries = operation === 'create' ? 1 : 3

  return retryOnFailure(
    () =>
      batch
        .reduce((trx, doc) => trx[operation](doc), client.transaction())
        .commit({visibility: 'async'})
        .then(progress)
        .then(res => res.results.length),
    {maxRetries, isRetriable}
  )
}

function isRetriable(err) {
  return !err.response || err.response.statusCode !== 409
}

module.exports = importBatches
