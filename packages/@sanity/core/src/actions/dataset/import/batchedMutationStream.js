import noop from 'lodash/noop'
import prettyMs from 'pretty-ms'
import batchStreamOperation from 'batch-stream-operation'
import debug from '../../../debug'

export default function batchedMutationStream(options) {
  const {mutator} = options
  const timeout = 605000
  const batchSize = options.batchSize || 150
  const concurrency = options.concurrency || 4
  const client = options.client.clone().config({timeout})
  const progress = options.progress || noop

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
    const transaction = batch.reduce(mutator, client.transaction())

    if (typeof transaction.commit !== 'function') {
      throw new Error('mutator must return transaction')
    }

    const currentBatch = ++batchNumber
    debug(`Performing transaction of ${batch.length} mutations (batch #${currentBatch})`)

    const transactionStart = Date.now()
    transaction.commit()
      .then(() => {
        const timeSpent = prettyMs(Date.now() - transactionStart)
        debug(`Batch #${currentBatch} completed (${timeSpent})`)
        progress()
        callback()
      })
      .catch(err => {
        debug(`Batch #${currentBatch} errored:`)
        debug(err)
        stream.emit('error', err)
      })
  }
}
