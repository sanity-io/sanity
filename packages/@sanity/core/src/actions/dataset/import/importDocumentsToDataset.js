import pumpify from 'pumpify'
import batchedMutationStream from './batchedMutationStream'
import getJsonStreamer from './getJsonStreamer'
import getReferenceWeakener from './getReferenceWeakener'
import getBatchedAssetImporter from './getBatchedAssetImporter'

export default (options, context) => new Promise((resolve, reject) => {
  importDocumentsToDataset(options, context, {resolve, reject})
})

function importDocumentsToDataset(options, context, promise) {
  const {resolve, reject} = promise
  const {inputStream, targetDataset, client, operation} = options

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
    // Read from input stream
    inputStream,
    // Split on each newline character and parse line as JSON
    getJsonStreamer(),
    // Make strong references weak, create reference maps so we can transform them back
    getReferenceWeakener(options),
    // Transform and upload assets
    getBatchedAssetImporter(options),
    // Batch into a transaction of mutations
    mutationStream
  )

  stream.once('error', reject)
  mutationStream.on('complete', () => resolve({timeSpent: Date.now() - startTime}))
}
