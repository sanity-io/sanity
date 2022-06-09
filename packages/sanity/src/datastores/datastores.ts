/* eslint-disable camelcase */

import {useMemo} from 'react'
import {useClient, useSchema, useTemplates} from '../hooks'
import {useSource, useWorkspace} from '../studio'
import {createDocumentPreviewStore, DocumentPreviewStore} from '../preview'
import {
  ConnectionStatusStore,
  createConnectionStatusStore,
} from './connection-status/connection-status-store'
import {CrossProjectTokenStore, __tmp_wrap_crossProjectToken} from './crossProjectToken'
import {createDocumentStore, DocumentStore} from './document'
import {createGrantsStore, GrantsStore} from './grants'
import {createHistoryStore, HistoryStore} from './history'
import {PresenceStore, __tmp_wrap_presenceStore} from './presence'
import {createProjectStore, ProjectStore} from './project'
import {useResourceCache} from './ResourceCacheProvider'
import {createSettingsStore, SettingsStore} from './settings'
import {createUserStore, useCurrentUser, UserStore} from './user'

export function useUserStore(): UserStore {
  const {client, currentUser} = useSource()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const userStore =
      resourceCache.get<UserStore>({
        namespace: 'userStore',
        dependencies: [client, currentUser],
      }) || createUserStore({client, currentUser})

    resourceCache.set({
      namespace: 'userStore',
      dependencies: [client, currentUser],
      value: userStore,
    })

    return userStore
  }, [client, currentUser, resourceCache])
}

export function useGrantsStore(): GrantsStore {
  const {client} = useSource()
  const currentUser = useCurrentUser()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const grantsStore =
      resourceCache.get<GrantsStore>({
        namespace: 'grantsStore',
        dependencies: [client, currentUser],
      }) || createGrantsStore({client, currentUser})

    resourceCache.set({
      namespace: 'grantsStore',
      dependencies: [client, currentUser],
      value: grantsStore,
    })

    return grantsStore
  }, [client, currentUser, resourceCache])
}

export function useHistoryStore(): HistoryStore {
  const client = useClient()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const historyStore =
      resourceCache.get<HistoryStore>({
        namespace: 'historyStore',
        dependencies: [client],
      }) || createHistoryStore({client})

    resourceCache.set({
      namespace: 'historyStore',
      dependencies: [client],
      value: historyStore,
    })

    return historyStore
  }, [client, resourceCache])
}

export function useDocumentPreviewStore(): DocumentPreviewStore {
  const client = useClient()
  const resourceCache = useResourceCache()
  const crossProjectTokenStore = useCrossProjectTokenStore()

  return useMemo(() => {
    const documentPreviewStore =
      resourceCache.get<DocumentPreviewStore>({
        namespace: 'documentPreviewStore',
        dependencies: [client, crossProjectTokenStore],
      }) || createDocumentPreviewStore({client, crossProjectTokenStore})

    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client, crossProjectTokenStore],
      value: documentPreviewStore,
    })

    return documentPreviewStore
  }, [client, resourceCache, crossProjectTokenStore])
}

export function useCrossProjectTokenStore() {
  const client = useClient()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const crossProjectTokenStore =
      resourceCache.get<CrossProjectTokenStore>({
        namespace: 'crossProjectTokenStore',
        dependencies: [client],
      }) || __tmp_wrap_crossProjectToken({client})

    resourceCache.set({
      namespace: 'crossProjectTokenStore',
      dependencies: [client],
      value: crossProjectTokenStore,
    })

    return crossProjectTokenStore
  }, [client, resourceCache])
}

export function useDocumentStore(): DocumentStore {
  const client = useClient()
  const schema = useSchema()
  const templates = useTemplates()
  const resourceCache = useResourceCache()
  const historyStore = useHistoryStore()
  const documentPreviewStore = useDocumentPreviewStore()

  return useMemo(() => {
    const documentStore =
      resourceCache.get<DocumentStore>({
        namespace: 'documentStore',
        dependencies: [client, documentPreviewStore, historyStore, schema],
      }) ||
      createDocumentStore({
        client,
        documentPreviewStore,
        historyStore,
        initialValueTemplates: templates,
        schema,
      })

    resourceCache.set({
      namespace: 'documentStore',
      dependencies: [client, documentPreviewStore, historyStore, schema],
      value: documentStore,
    })

    return documentStore
  }, [client, documentPreviewStore, historyStore, resourceCache, schema, templates])
}

export function useConnectionStatusStore(): ConnectionStatusStore {
  const {bifur} = useSource().__internal
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const connectionStatusStore =
      resourceCache.get<ConnectionStatusStore>({
        namespace: 'connectionStatusStore',
        dependencies: [bifur],
      }) || createConnectionStatusStore({bifur})

    resourceCache.set({
      namespace: 'connectionStatusStore',
      dependencies: [bifur],
      value: connectionStatusStore,
    })

    return connectionStatusStore
  }, [bifur, resourceCache])
}

export function usePresenceStore(): PresenceStore {
  const {
    __internal: {bifur},
  } = useSource()
  const resourceCache = useResourceCache()
  const userStore = useUserStore()
  const connectionStatusStore = useConnectionStatusStore()

  return useMemo(() => {
    const presenceStore =
      resourceCache.get<PresenceStore>({
        namespace: 'presenceStore',
        dependencies: [bifur, connectionStatusStore, userStore],
      }) || __tmp_wrap_presenceStore({bifur, connectionStatusStore, userStore})

    resourceCache.set({
      namespace: 'presenceStore',
      dependencies: [bifur, connectionStatusStore, userStore],
      value: presenceStore,
    })

    return presenceStore
  }, [bifur, connectionStatusStore, resourceCache, userStore])
}

export function useProjectStore(): ProjectStore {
  const client = useClient()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const projectStore =
      resourceCache.get<ProjectStore>({
        namespace: 'projectStore',
        dependencies: [client],
      }) || createProjectStore({client})

    resourceCache.set({
      namespace: 'projectStore',
      dependencies: [client],
      value: projectStore,
    })

    return projectStore
  }, [client, resourceCache])
}

export function useSettingsStore(): SettingsStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()

  return useMemo(() => {
    const settingsStore =
      resourceCache.get<SettingsStore>({
        dependencies: [workspace],
        namespace: 'settingsStore',
      }) || createSettingsStore()

    resourceCache.set({
      dependencies: [workspace],
      namespace: 'settingsStore',
      value: settingsStore,
    })

    return settingsStore
  }, [resourceCache, workspace])
}
