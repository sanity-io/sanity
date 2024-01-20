import {SanityEncoder} from '@bjoerge/mutiny'
import {type Mutation as SanityMutation} from '@sanity/client'
import arrify from 'arrify'

import {type Mutation, type Transaction} from '../../mutations'
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
          mutations: SanityEncoder.encode(mut.mutations as any) as SanityMutation[],
        }
        continue
      }

      yield SanityEncoder.encode(arrify(mut) as any[]) as SanityMutation[]
    }
  }
}
