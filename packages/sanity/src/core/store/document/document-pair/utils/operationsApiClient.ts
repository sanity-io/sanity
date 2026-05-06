import {type SanityClient} from '@sanity/client'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../../releases/util/releasesClient'
import {type IdPair} from '../../types'

export function operationsApiClient(client: SanityClient, _idPair?: IdPair): SanityClient {
  return client.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS)
}
