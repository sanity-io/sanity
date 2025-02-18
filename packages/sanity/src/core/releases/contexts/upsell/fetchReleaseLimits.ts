import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'

interface ReleaseLimits {
  orgActiveReleaseCount: number
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

/**
 * @internal
 * fetches subscriptions for this project
 */
export function fetchReleaseLimits({
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
      uri: '/features',
      //   uri: `project/${versionedClient.config().projectId}/new-content-release-allowed`,
      tag: 'new-content-release-allowed',
    })
}
