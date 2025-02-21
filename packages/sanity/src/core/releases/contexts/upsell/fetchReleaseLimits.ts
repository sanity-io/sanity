import {type ClientError, type ObservableSanityClient} from '@sanity/client'
import {catchError, map, type Observable, of, share} from 'rxjs'

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
export function fetchReleaseLimits(clientOb: ObservableSanityClient): Observable<ReleaseLimits> {
  const {projectId} = clientOb.config()

  // This endpoint is prone to optimisation and further work
  // it will never live within a versions API and will always be on vX
  // until it goes away - there is graceful handling in `catchError`
  // for when this endpoint is no longer available and limits are fetched
  // some other way

  return clientOb
    .withConfig({apiVersion: 'vX'})
    .request<ReleaseLimitsResponse>({
      uri: `projects/${projectId}/new-content-release-allowed`,
      // tag: `new-${new Date().getTime()}`,
      tag: 'new-content-release-allowed',
    })
    .pipe(
      share(),
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
