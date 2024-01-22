import {SanityEncoder, Mutation} from '@bjoerge/mutiny'
import {Mutation as SanityMutation} from '@sanity/client'

export async function* toSanityMutations(
  it: AsyncIterableIterator<Mutation | Mutation[]>,
): AsyncIterableIterator<SanityMutation | SanityMutation[]> {
  for await (const mutation of it) {
    if (Array.isArray(mutation)) {
      yield SanityEncoder.encode(mutation)
      continue
    }
    yield SanityEncoder.encode([mutation])[0]
  }
}
