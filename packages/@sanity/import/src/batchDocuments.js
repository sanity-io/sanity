const MAX_PAYLOAD_SIZE = 1024 * 256 // 256KB

function batchDocuments(docs) {
  let currentBatch = []
  let currentBatchSize = 0
  const batches = [currentBatch]

  docs.forEach((doc) => {
    const docSize = JSON.stringify(doc).length
    const newBatchSize = currentBatchSize + docSize

    // If this document pushes us over the max payload size, start a new batch
    if (currentBatchSize > 0 && newBatchSize > MAX_PAYLOAD_SIZE) {
      currentBatch = [doc]
      currentBatchSize = docSize
      batches.push(currentBatch)
      return
    }

    // If this document *alone* is over the max payload size, try to allow it
    // on it's own. Server has slightly higher payload size than defined here
    if (docSize > MAX_PAYLOAD_SIZE) {
      if (currentBatchSize === 0) {
        // We're alone in a new batch, so push this doc into it and start a new
        // one for the next document in line
        currentBatch.push(doc)
        currentBatchSize = docSize
        currentBatch = []
        batches.push(currentBatch)
        return
      }

      // Batch already has documents, so "close" that batch off and push this
      // huge document into it's own batch
      currentBatch = []
      currentBatchSize = 0
      batches.push([doc], currentBatch)
    }

    // Otherwise, we should be below the max size, so push this document into
    // the batch and increase the size of it to match
    currentBatch.push(doc)
    currentBatchSize += docSize
  })

  return batches
}

module.exports = batchDocuments
