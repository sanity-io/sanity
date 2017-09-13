const pMap = require('p-map')

const DOCUMENT_IMPORT_CONCURRENCY = 3

async function importBatches(batches, options) {
  const mapOptions = {concurrency: DOCUMENT_IMPORT_CONCURRENCY}
  const batchSizes = await pMap(
    batches,
    importBatch.bind(null, options),
    mapOptions
  )

  return batchSizes.reduce((prev, add) => prev + add, 0)
}

function importBatch(options, batch) {
  const {client, operation} = options
  return batch
    .reduce((trx, doc) => trx[operation](doc), client.transaction())
    .commit({visibility: 'async'})
    .then(res => res.results.length)
}

module.exports = importBatches
