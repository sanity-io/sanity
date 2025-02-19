/* eslint-disable no-console */
import {type ClientError, type SanityClient} from '@sanity/client'
import {catchError, delay, map, type Observable, of, tap} from 'rxjs'

interface ReleaseLimits {
  orgActiveReleaseCount: number
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

interface ReleaseLimitsResponse {
  data: ReleaseLimits
}

const USE_STUB = false

const stubFetchReleasesLimits = ({versionedClient}: {versionedClient: SanityClient}) =>
  of({
    orgActiveReleaseCount: 6,
    orgActiveReleaseLimit: 20,
    datasetReleaseLimit: 6,

    // orgActiveReleaseCount: 6,
    // orgActiveReleaseLimit: 6,
    // datasetReleaseLimit: 10,
  }).pipe(
    tap(() => console.log('fetchReleasesLimits')),
    delay(3000),
  )

// export const stubFetchReleasesLimits = () =>
//   throwError(() => new Error('Simulated API failure')).pipe(
//     tap(() => console.log('fetchReleasesLimits - Simulating failure')),
//     delay(3000),
//   )

/**
 * @internal
 * fetches subscriptions for this project
 */
// export function fetchReleaseLimits({
export function _fetchReleaseLimits({
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
        console.error(error.message)
        // body will still contain the limits and current count (if available)
        // so still want to return these and just silently log the error
        return of(error.response.body as ReleaseLimitsResponse)
      }),
      map(({data}) => data),
    )
}

export const fetchReleaseLimits = USE_STUB ? stubFetchReleasesLimits : _fetchReleaseLimits
