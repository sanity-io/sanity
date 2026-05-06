import {type SanityClient} from '@sanity/client'

import {type IdPair} from '../../types'

const ACTIONS_API_MINIMUM_VERSION = '2025-02-19'

export function actionsApiClient(client: SanityClient, _idPair?: IdPair): SanityClient {
  return client.withConfig({
    apiVersion: ACTIONS_API_MINIMUM_VERSION,
  })
}
