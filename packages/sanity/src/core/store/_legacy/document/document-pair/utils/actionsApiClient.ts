import {type SanityClient} from '@sanity/client'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../../../releases/util/releasesClient'
import {type IdPair} from '../../types'

const ACTIONS_API_MINIMUM_VERSION = '2025-02-19'

export function actionsApiClient(client: SanityClient, idPair: IdPair): SanityClient {
  if (idPair.versionId) {
    // TODO: Remove after API version is stable and support releases
    return client.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS)
  }
  return client.withConfig({
    apiVersion: ACTIONS_API_MINIMUM_VERSION,
  })
}
