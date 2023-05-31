import type {Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {ResourcesResponse} from './types'

/**
 * @internal Not a stable API yet
 */

export function checkResourcesStatus(client: SanityClient): Observable<ResourcesResponse> {
  const request$ = client.observable
    .request<ResourcesResponse>({
      url: '/help',
      json: true,
    })
    .pipe(map((result) => ({...result})))

  return request$
}
