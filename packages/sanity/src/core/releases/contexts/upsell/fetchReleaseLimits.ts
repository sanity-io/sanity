import {type ClientError, type SanityClient} from '@sanity/client'
import {catchError, map, type Observable, of} from 'rxjs'

export interface ReleaseLimits {
  orgActiveReleaseCount: number
  defaultOrgActiveReleaseLimit: number
  datasetReleaseLimit: number
  // internal server error has no fallback number - it uses null
  orgActiveReleaseLimit: number | null
}

interface ReleaseLimitsResponse {
  data: ReleaseLimits
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
  return versionedClient.observable
    .request<ReleaseLimitsResponse>({
      uri: `projects/${versionedClient.config().projectId}/new-content-release-allowed`,
      tag: 'new-content-release-allowed',
    })
    .pipe(
      catchError((error: ClientError) => {
        console.error(error)

        if (typeof error.response.body !== 'string' && 'data' in error.response.body) {
          // body will still contain the limits and current count (if available)
          // so still want to return these and just silently log the error
          return of(error.response.body as ReleaseLimitsResponse)
        }

        // for internal server errors, or as a fallback
        // propagate up the error
        throw error
      }),
      map(({data}) => data),
    )
}
