import {Mutation as SanityMutation} from '@sanity/client'
import arrify from 'arrify'

// We're working on "raw" mutations, e.g what will be put into the mutations array in the request body
const PADDING_SIZE = '{"mutations":[]}'.length

/**
 *
 * @param mutations - Async iterable of either single values or arrays of values
 * @param maxBatchSize - Max batch size in bytes
 * Todo: add support for transaction ids too
 */
export async function* batchMutations(
  mutations: AsyncIterableIterator<SanityMutation | SanityMutation[]>,
  maxBatchSize: number,
  options?: {preserveTransactions: boolean},
): AsyncIterableIterator<SanityMutation[]> {
  let currentBatch: SanityMutation[] = []
  let currentBatchSize = 0

  for await (const mutation of mutations) {
    if (options?.preserveTransactions && Array.isArray(mutation)) {
      yield currentBatch
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
        yield currentBatch
      }
      yield [...arrify(mutation)]
      currentBatch = []
      currentBatchSize = 0
      continue
    }
    currentBatchSize += mutationSize
    if (currentBatchSize >= maxBatchSize + PADDING_SIZE) {
      yield currentBatch
      currentBatch = []
      currentBatchSize = 0
    }
    currentBatch.push(...arrify(mutation))
  }

  if (currentBatch.length > 0) {
    yield currentBatch
  }
}
