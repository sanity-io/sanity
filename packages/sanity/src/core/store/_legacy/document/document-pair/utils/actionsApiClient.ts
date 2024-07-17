import {type SanityClient} from 'sanity'

const ACTIONS_API_MINIMUM_VERSION = '2024-05-23'

export function actionsApiClient(client: SanityClient): SanityClient {
  return client.withConfig({
    apiVersion: ACTIONS_API_MINIMUM_VERSION,
  })
}
