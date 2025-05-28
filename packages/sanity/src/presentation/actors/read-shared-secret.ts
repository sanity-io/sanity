import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

/** @internal */
export function defineReadSharedSecretActor({
  client,
}: {
  client: SanityClient
}): PromiseActorLogic<string | null> {
  return fromPromise(async () => {
    return client.fetch<string | null>(
      fetchSharedAccessQuery,
      {},
      {tag: 'presentation.fallback-to-shared-access-secret'},
    )
  })
}
