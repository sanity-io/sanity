import {type Mutation, SanityEncoder, type Transaction} from '@sanity/mutate'
import {type SanityMutation} from '@sanity/mutate/_unstable_store'
import arrify from 'arrify'

import {isTransaction} from '../../mutations/asserters'

export interface TransactionPayload {
  transactionId?: string
  mutations: SanityMutation[]
}

export async function* toSanityMutations(
  it: AsyncIterableIterator<Mutation | Transaction | (Mutation | Transaction)[]>,
): AsyncIterableIterator<SanityMutation[] | TransactionPayload> {
  for await (const mutation of it) {
    for (const mut of arrify(mutation)) {
      if (isTransaction(mut)) {
        yield {
          transactionId: mut.id,
          mutations: SanityEncoder.encodeAll(mut.mutations),
        }
        continue
      }

      yield SanityEncoder.encodeAll([mut as Mutation])
    }
  }
}
