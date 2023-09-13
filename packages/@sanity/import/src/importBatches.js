const pMap = require('p-map')
const progressStepper = require('./util/progressStepper')
const retryOnFailure = require('./util/retryOnFailure')
const suffixTag = require('./util/suffixTag')

const DOCUMENT_IMPORT_CONCURRENCY = 6

async function importBatches(batches, options) {
  const progress = progressStepper(options.onProgress, {
    step: 'Importing documents',
    total: batches.length,
  })

  const mapOptions = {concurrency: DOCUMENT_IMPORT_CONCURRENCY}
  const batchSizes = await pMap(batches, importBatch.bind(null, options, progress), mapOptions)

  return batchSizes.reduce((prev, add) => prev + add, 0)
}

function importBatch(options, progress, batch) {
  const {client, operation, tag} = options
  const maxRetries = operation === 'create' ? 1 : 3

  return retryOnFailure(
    () =>
      batch
        .reduce((trx, doc) => trx[operation](doc), client.transaction())
        .commit({visibility: 'async', tag: suffixTag(tag, 'doc.create')})
        .then(progress)
        .then((res) => res.results.length),
    {maxRetries, isRetriable},
  )
}

function isRetriable(err) {
  return !err.response || err.response.statusCode !== 409
}

module.exports = importBatches
