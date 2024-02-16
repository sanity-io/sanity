import {type Mutation as SanityMutation} from '@sanity/client'
import arrify from 'arrify'

import {type TransactionPayload} from './toSanityMutations'

// We're working on "raw" mutations, e.g what will be put into the mutations array in the request body
const PADDING_SIZE = '{"mutations":[]}'.length

function isTransactionPayload(payload: any): payload is TransactionPayload {
  return payload && payload.mutations && Array.isArray(payload.mutations)
}

/**
 *
 * @param mutations - Async iterable of either single values or arrays of values
 * @param maxBatchSize - Max batch size in bytes
 * @public
 *
 */
export async function* batchMutations(
  mutations: AsyncIterableIterator<TransactionPayload | SanityMutation | SanityMutation[]>,
  maxBatchSize: number,
): AsyncIterableIterator<TransactionPayload> {
  let currentBatch: SanityMutation[] = []
  let currentBatchSize = 0

  for await (const mutation of mutations) {
    if (isTransactionPayload(mutation)) {
      yield {mutations: currentBatch}
      yield mutation
      currentBatch = []
      currentBatchSize = 0
      continue
    }

    // the mutation itself may exceed the payload size, need to handle that
    const mutationSize = JSON.stringify(mutation).length

    if (mutationSize >= maxBatchSize + PADDING_SIZE) {
      // the mutation size itself is bigger than max batch size, yield it as a single batch and hope for the best (the server has a bigger limit)
      if (currentBatch.length) {
        yield {mutations: currentBatch}
      }
      yield {mutations: [...arrify(mutation)]}
      currentBatch = []
      currentBatchSize = 0
      continue
    }
    currentBatchSize += mutationSize
    if (currentBatchSize >= maxBatchSize + PADDING_SIZE) {
      yield {mutations: currentBatch}
      currentBatch = []
      currentBatchSize = 0
    }
    currentBatch.push(...arrify(mutation))
  }

  if (currentBatch.length > 0) {
    yield {mutations: currentBatch}
  }
}
