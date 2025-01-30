import {type SanityClient} from '@sanity/client'

// TODO: COREL - Replace once releases API are stable.
const ACTIONS_API_MINIMUM_VERSION = 'vX'

export function actionsApiClient(client: SanityClient): SanityClient {
  return client.withConfig({
    apiVersion: ACTIONS_API_MINIMUM_VERSION,
  })
}
