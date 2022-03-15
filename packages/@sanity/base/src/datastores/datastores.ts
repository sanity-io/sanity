/* eslint-disable camelcase */

import {createAuthController} from '../auth/authController'
import {createDocumentPreviewStore} from '../preview'
import {createAuthStore} from './authState'
import {createConnectionStatusStore} from './connection-status/connection-status-store'
import {__tmp_wrap_crossProjectToken} from './crossProjectToken'
import {__tmp_crossWindowMessaging} from './crossWindowMessaging'
import {createDocumentStore} from './document'
import {createGrantsStore} from './grants'
import {createHistoryStore} from './history'
import {__tmp_wrap_presenceStore} from './presence'
import {createProjectStore} from './project/projectStore'
import {createSettingsStore} from './settings/settingsStore'
import {Datastores, DatastoresContext} from './types'
import {createUserStore} from './user'

export function createDatastores(context: DatastoresContext): Datastores {
  const {bifur, client, config, source} = context

  const projectId = source.projectId
  const versionedClient = client.withConfig({apiVersion: '1'})

  const authenticationFetcher = createAuthController({client, config: config.auth})
  const crossWindowMessaging = __tmp_crossWindowMessaging({projectId})
  const authStore = createAuthStore({crossWindowMessaging, projectId})
  const userStore = createUserStore({
    authenticationFetcher,
    authStore,
    sanityClient: client,
    projectId,
  })
  const grantsStore = createGrantsStore(client, userStore)
  const historyStore = createHistoryStore(client)
  const crossProjectTokenStore = __tmp_wrap_crossProjectToken({versionedClient})
  const documentPreviewStore = createDocumentPreviewStore({crossProjectTokenStore, versionedClient})
  const documentStore = createDocumentStore(
    client,
    documentPreviewStore,
    historyStore,
    source.schema,
    source.initialValueTemplates
  )
  const connectionStatusStore = createConnectionStatusStore(bifur)
  const presenceStore = __tmp_wrap_presenceStore({bifur, connectionStatusStore, userStore})
  const settingsStore = createSettingsStore()
  const projectStore = createProjectStore({client})

  return {
    crossProjectTokenStore,
    documentStore,
    documentPreviewStore,
    grantsStore,
    historyStore,
    presenceStore,
    projectStore,
    settingsStore,
    userStore,
  }
}
