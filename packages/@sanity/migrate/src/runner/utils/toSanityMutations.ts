import {Mutation as SanityMutation} from '@sanity/client'
import {SanityEncoder} from '@bjoerge/mutiny'
import {Mutation, Transaction} from '../../mutations'
import {isTransaction} from '../../mutations/asserters'

export interface TransactionPayload {
  id?: string
  mutations: SanityMutation[]
}

export async function* toSanityMutations(
  it: AsyncIterableIterator<Mutation | Transaction | (Mutation | Transaction)[]>,
): AsyncIterableIterator<SanityMutation[] | TransactionPayload> {
  for await (const mutation of it) {
    if (isTransaction(mutation)) {
      yield {
        id: mutation.id,
        mutations: SanityEncoder.encode(mutation.mutations as any) as SanityMutation[],
      }
      continue
    }
    yield SanityEncoder.encode(mutation as any[]) as SanityMutation[]
  }
}
