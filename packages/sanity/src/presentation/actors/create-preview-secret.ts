import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

/** @internal */
export function defineCreatePreviewSecretActor({
  client,
  currentUserId,
}: {
  client: SanityClient
  currentUserId: string | undefined
}): PromiseActorLogic<{
  secret: string
  expiresAt: Date
}> {
  return fromPromise(async () => {
    return await createPreviewSecret(client, 'sanity/presentation', location.href, currentUserId)
  })
}
