import createClient from '@sanity/client'
import batchStreamOperation from 'batch-stream-operation'
import debug from '../../debug'

export default function batchedMutationStream(options) {
  const {apiClient, dataset, mutator, preCommit} = options
  const timeout = 45000
  const batchSize = options.batchSize || 175
  const concurrency = options.concurrency || 3
  const client = createClient(Object.assign({}, apiClient().config(), {dataset, timeout}))

  const streamOptions = {objectMode: true}
  const stream = batchStreamOperation({
    operation: processBatch,
    batchSize,
    concurrency,
    streamOptions
  })

  let batchNumber = 0
  return stream

  function processBatch(batch, callback) {
    // Build a transaction containing all the mutations in the batch
    // The mutator is responsible for applying the wanted mutation and then return the transaction
    const reduced = batch.reduce(mutator, client.transaction())

    if (typeof reduced.commit !== 'function') {
      throw new Error('mutator must return transaction')
    }

    const currentBatch = ++batchNumber
    debug(`Performing transaction of ${batch.length} mutations (batch #${currentBatch})`)

    const transaction = preCommit ? preCommit(reduced) : reduced
    transaction.commit()
      .then(() => {
        debug(`Batch #${currentBatch} completed, calling back`)
        callback()
      })
      .catch(err => {
        debug(`Batch #${currentBatch} errored:`)
        debug(err)
        stream.emit('error', err)
      })
  }
}
