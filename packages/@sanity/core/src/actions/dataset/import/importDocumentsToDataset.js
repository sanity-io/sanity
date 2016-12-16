import fsp from 'fs-promise'
import pumpify from 'pumpify'
import batchedMutationStream from './batchedMutationStream'
import getJsonStreamer from './getJsonStreamer'
import getDatasetRewriter from './getDatasetRewriter'
import getReferenceWeakener from './getReferenceWeakener'
import getAssetImporter from './getAssetImporter'

export default (options, context) => new Promise((resolve, reject) => {
  importDocumentsToDataset(options, context, {resolve, reject})
})

function importDocumentsToDataset(options, context, promise) {
  const {resolve, reject} = promise
  const {sourceFile, targetDataset, fromDataset, client, operation} = options

  // Create stream that batches documents into transactions
  const mutationStream = batchedMutationStream({
    client,
    mutator: (transaction, doc) => transaction[operation](doc),
    dataset: targetDataset,
    progress: options.progress,
    batchSize: options.batchSize
  })

  const startTime = Date.now()
  const stream = pumpify(
    // Read from input file
    fsp.createReadStream(sourceFile),
    // Split on each newline character and parse line as JSON
    getJsonStreamer(),
    // Rewrite IDs if we're importing to a different dataset
    getDatasetRewriter(fromDataset, targetDataset),
    // Make strong references weak, create reference maps so we can transform them back
    getReferenceWeakener(options),
    // Transform and upload assets
    getAssetImporter(options),
    // Batch into a transaction of mutations
    mutationStream
  )

  stream.once('error', reject)
  mutationStream.on('complete', () => resolve({timeSpent: Date.now() - startTime}))
}
