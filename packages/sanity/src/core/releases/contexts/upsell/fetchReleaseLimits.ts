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

function isErrorAtLimits(error: ClientError) {
  return (
    error.statusCode === 403 &&
    typeof error.response.body !== 'string' &&
    'data' in error.response.body
  )
}

/**
 * @internal
 * fetches subscriptions for this project
 */
export function fetchReleaseLimits(
  client: SanityClient,
  storeOrigin: string,
): Observable<ReleaseLimits> {
  const {projectId} = client.config()

  // This endpoint is prone to optimisation and further work
  // it will never live within a versions API and will always be on vX
  // until it goes away - there is graceful handling in `catchError`
  // for when this endpoint is no longer available and limits are fetched
  // some other way
  const clientX = client.withConfig({apiVersion: 'vX'})

  return clientX.observable
    .request<ReleaseLimitsResponse>({
      uri: `projects/${projectId}/new-content-release-allowed`,
      /**
       * In a particular case when both releaseLimits
       * and orgActiveReleaseCount stores are empty, 2 fetch calls are made
       * to guard the create/archive/revert actions - browsers behave differently.
       *
       * Chromium based browsers will stall the second network request until the first
       * resolves by attaching the store name to the tag, this spoofs 2 unique requests
       * allowing both the fire in parallel.
       */
      tag: `new-content-release-allowed-${storeOrigin}`,
    })
    .pipe(
      catchError((error: ClientError) => {
        console.error(error)

        if (isErrorAtLimits(error)) {
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
