import fsp from 'fs-promise'
import split2 from 'split2'
import {transformStrongRefs} from '../../util/strongReferences'
import batchedMutationStream from './batchedMutationStream'
import getDatasetRewriter from './getDatasetRewriter'

export default (options, context) => new Promise((resolve, reject) => {
  importDocumentsToDataset(options, context, {resolve, reject})
})

function importDocumentsToDataset(options, context, promise) {
  const {resolve, reject} = promise
  const {sourceFile, targetDataset, fromDataset, importId, client, operation} = options

  // Create stream that batches documents into transactions
  const mutationStream = batchedMutationStream({
    client,
    preCommit,
    dataset: targetDataset,
    mutator: mutateDocument,
    progress: options.progress
  })

  const startTime = Date.now()

  // Read from input file
  fsp.createReadStream(sourceFile)
    // Split on each newline character and parse line as JSON
    .pipe(split2(JSON.parse))
    // Rewrite IDs if we're importing to a different dataset
    .pipe(getDatasetRewriter(fromDataset, targetDataset))
    // Batch into a transaction of mutations
    .pipe(mutationStream)
    .once('error', reject)
    .on('complete', done)

  // Create mutations out of a document, and transform references
  const batchState = {referenceMaps: []}
  function mutateDocument(transaction, originalDoc) {
    const {doc, referenceMap} = transformStrongRefs(originalDoc)
    if (referenceMap.refs.length > 0) {
      batchState.referenceMaps.push(referenceMap)
    }

    return transaction[operation](doc)
  }

  // Create a document that holds all the references we need to fix post-import
  function preCommit(transaction) {
    if (batchState.referenceMaps.length > 0) {
      transaction.create({
        _id: `${targetDataset}/sanity/`,
        _type: 'sanity.importmap',
        importId: importId,
        referenceMaps: batchState.referenceMaps
      })
    }

    return transaction
  }

  function done() {
    resolve({timeSpent: Date.now() - startTime})
  }
}
