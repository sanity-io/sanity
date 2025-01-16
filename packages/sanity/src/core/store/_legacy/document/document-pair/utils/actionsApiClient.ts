import {type SanityClient} from '@sanity/client'

const ACTIONS_API_MINIMUM_VERSION = 'vX'

export function actionsApiClient(client: SanityClient): SanityClient {
  return client.withConfig({
    apiVersion: ACTIONS_API_MINIMUM_VERSION,
  })
}
