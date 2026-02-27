import {type SanityClient} from '@sanity/client'
import {
  catchError,
  map,
  type Observable,
  of,
  repeat,
  ReplaySubject,
  share,
  shareReplay,
  timer,
} from 'rxjs'

import {memoize} from '../document/utils/createMemoizer'
import {type ProjectData, type ProjectGrants, type ProjectStore} from './types'

const REFETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * This value will be cached for 5 minutes, after that internal the cache will be refreshed.
 * If you need to be 100% sure the organizationId is up to date, you can call the `/projects/${projectId}` endpoint directly.
 */
const getOrganizationId = memoize(
  (client: SanityClient) => {
    return client.observable
      .request<ProjectData>({
        url: `/projects/${client.config().projectId}`,
        tag: 'get-org-id',
        query: {
          includeMembers: 'false',
          includeFeatures: 'false',
          includeOrganization: 'true',
        },
      })
      .pipe(
        map((res) => res.organizationId),
        catchError(() => {
          return of(null)
        }),
        repeat({delay: REFETCH_INTERVAL}),
        share({
          connector: () => new ReplaySubject(1),
          resetOnComplete: true,
          // delay unsubscriptions a little to keep the observable active
          // during React effect setup and teardown due to rapidly changing deps
          resetOnRefCountZero: () => timer(1000),
        }),
      )
  },
  (client) => `${client.config().projectId}-${client.config().dataset}`,
)

/** @internal */
export function createProjectStore(context: {client: SanityClient}): ProjectStore {
  const {client} = context
  const projectId = client.config().projectId
  const versionedClient = client.withConfig({apiVersion: '2021-12-15'})

  function get(): Observable<ProjectData> {
    return versionedClient.observable.request({
      url: `/projects/${projectId}`,
      tag: 'get-project',
    })
  }

  function getDatasets() {
    return versionedClient.observable.request({
      url: `/projects/${projectId}/datasets`,
      tag: 'get-datasets',
    })
  }

  // Share and replay the grants result so permission checks reuse the same response.
  const grants$ = versionedClient.observable
    .request<ProjectGrants>({
      url: `/projects/${projectId}/grants`,
      tag: 'get-grants',
    })
    .pipe(shareReplay(1))

  return {
    get,
    getDatasets,
    getGrants: () => grants$,
    getOrganizationId: () => getOrganizationId(versionedClient),
  }
}
