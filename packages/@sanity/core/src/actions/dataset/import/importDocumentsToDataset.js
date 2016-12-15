import fsp from 'fs-promise'
import batchedMutationStream from './batchedMutationStream'
import getJsonStreamer from './getJsonStreamer'
import getDatasetRewriter from './getDatasetRewriter'
import getReferenceWeakener from './getReferenceWeakener'

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

  // Read from input file
  fsp.createReadStream(sourceFile)
    // Split on each newline character and parse line as JSON
    .pipe(getJsonStreamer())
    // Rewrite IDs if we're importing to a different dataset
    .pipe(getDatasetRewriter(fromDataset, targetDataset))
    // Make strong references weak, create reference maps so we can transform them back
    .pipe(getReferenceWeakener(options))
    // Batch into a transaction of mutations
    .pipe(mutationStream)
    .once('error', reject)
    .on('complete', () => resolve({timeSpent: Date.now() - startTime}))
}
