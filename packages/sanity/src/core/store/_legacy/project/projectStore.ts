import {type SanityClient} from '@sanity/client'
import {catchError, map, type Observable, of, repeat, shareReplay} from 'rxjs'

import {memoize} from '../document/utils/createMemoizer'
import {type ProjectData, type ProjectStore} from './types'

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
        repeat({delay: REFETCH_INTERVAL}),
        shareReplay(1),
        catchError(() => {
          return of(null)
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
    })
  }

  function getDatasets() {
    return versionedClient.observable.request({
      url: `/projects/${projectId}/datasets`,
    })
  }

  return {get, getDatasets, getOrganizationId: () => getOrganizationId(versionedClient)}
}
