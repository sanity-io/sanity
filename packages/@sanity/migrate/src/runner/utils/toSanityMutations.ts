import {Mutation as SanityMutation} from '@sanity/client'
import {SanityEncoder} from '@bjoerge/mutiny'
import {Mutation} from '../../mutations'

export async function* toSanityMutations(
  it: AsyncIterableIterator<Mutation | Mutation[]>,
): AsyncIterableIterator<SanityMutation | SanityMutation[]> {
  for await (const mutation of it) {
    if (Array.isArray(mutation)) {
      yield SanityEncoder.encode(mutation as any)
      continue
    }
    yield SanityEncoder.encode([mutation as any])[0]
  }
}
