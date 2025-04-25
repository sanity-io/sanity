import {type SanityClient} from '@sanity/client'
import {map, type Observable, shareReplay} from 'rxjs'

import {memoize} from '../document/utils/createMemoizer'
import {type ProjectData, type ProjectStore} from './types'

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
        shareReplay(1),
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
