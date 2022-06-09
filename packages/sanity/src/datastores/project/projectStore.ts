import {SanityClient} from '@sanity/client'
import {Observable} from 'rxjs'
import {ProjectData, ProjectStore} from './types'

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

  return {get, getDatasets}
}
