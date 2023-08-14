/* eslint-disable camelcase */

import {useMemo} from 'react'
import {useClient, useSchema, useTemplates} from '../../hooks'
import {createDocumentPreviewStore, DocumentPreviewStore} from '../../preview'
import {useSource, useWorkspace} from '../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useCurrentUser} from '../user'
import {
  ConnectionStatusStore,
  createConnectionStatusStore,
} from './connection-status/connection-status-store'
import {createDocumentStore, DocumentStore} from './document'
import {createGrantsStore, GrantsStore} from './grants'
import {createHistoryStore, HistoryStore} from './history'
import {PresenceStore, __tmp_wrap_presenceStore} from './presence'
import {createProjectStore, ProjectStore} from './project'
import {useResourceCache} from './ResourceCacheProvider'
import {createSettingsStore, SettingsStore} from './settings'
import {createUserStore, UserStore} from './user'

/**
 * @hidden
 * @beta */
export function useUserStore(): UserStore {
  const {getClient, currentUser} = useSource()
  const resourceCache = useResourceCache()
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

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

/**
 * @hidden
 * @beta */
export function useGrantsStore(): GrantsStore {
  const {getClient} = useSource()
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

/**
 * @hidden
 * @beta */
export function useHistoryStore(): HistoryStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

/**
 * @hidden
 * @beta */
export function useDocumentPreviewStore(): DocumentPreviewStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const documentPreviewStore =
      resourceCache.get<DocumentPreviewStore>({
        namespace: 'documentPreviewStore',
        dependencies: [client],
      }) || createDocumentPreviewStore({client})

    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client],
      value: documentPreviewStore,
    })

    return documentPreviewStore
  }, [client, resourceCache])
}

/**
 * @hidden
 * @beta */
export function useDocumentStore(): DocumentStore {
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const templates = useTemplates()
  const resourceCache = useResourceCache()
  const historyStore = useHistoryStore()
  const documentPreviewStore = useDocumentPreviewStore()

  return useMemo(() => {
    const documentStore =
      resourceCache.get<DocumentStore>({
        namespace: 'documentStore',
        dependencies: [getClient, documentPreviewStore, historyStore, schema, i18n],
      }) ||
      createDocumentStore({
        getClient,
        documentPreviewStore,
        historyStore,
        initialValueTemplates: templates,
        schema,
        i18n,
      })

    resourceCache.set({
      namespace: 'documentStore',
      dependencies: [getClient, documentPreviewStore, historyStore, schema, i18n],
      value: documentStore,
    })

    return documentStore
  }, [getClient, documentPreviewStore, historyStore, resourceCache, schema, templates, i18n])
}

/** @internal */
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

/**
 * @hidden
 * @beta */
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

/**
 * @hidden
 * @beta */
export function useProjectStore(): ProjectStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

/** @internal */
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
