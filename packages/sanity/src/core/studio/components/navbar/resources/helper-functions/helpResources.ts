import type {Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {SANITY_VERSION} from '../../../../../version'
import {ResourcesResponse} from './types'

/**
 * @internal Not a stable API yet
 * @hidden
 */
export function getHelpResources(client: SanityClient): Observable<ResourcesResponse> {
  const request$ = client
    .withConfig({apiVersion: '1'})
    .observable.request<ResourcesResponse>({
      url: '/help',
      /*
      query and tag is used by analytics for tracking.
      Builds to: `{m: ['sanity@3.0.2']}' and serializes to: `?m=sanity@3.0.2`.
      Final format will be e.g. https://api.sanity.io/v1/help?tag=sanity.studio.module.version-check&m=sanity%403.0.2
      */
      query: {m: [`sanity@${SANITY_VERSION}`]},
      tag: 'module.version-check',
      json: true,
    })
    .pipe(map((result) => ({...result})))

  return request$
}
