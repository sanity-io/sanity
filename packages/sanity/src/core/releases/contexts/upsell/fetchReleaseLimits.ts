import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'

import {fetchReleasesLimits} from './ReleasesUpsellProvider'

interface ReleaseLimits {
  orgActiveReleaseCount: number
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

const USE_STUB = false

/**
 * @internal
 * fetches subscriptions for this project
 */
export function _fetchReleaseLimits({
  versionedClient,
}: {
  versionedClient: SanityClient
}): Observable<ReleaseLimits> {
  return versionedClient
    .withConfig({
      useProjectHostname: false,
      apiHost: 'https://api.sanity.work',
    })
    .observable.request<ReleaseLimits>({
      uri: `project/${versionedClient.config().projectId}/new-content-release-allowed`,
      tag: 'new-content-release-allowed',
    })
}

export const fetchReleaseLimits = USE_STUB ? fetchReleasesLimits : _fetchReleaseLimits
