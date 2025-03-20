/* eslint-disable camelcase */

import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {of} from 'rxjs'

import {useClient, useSchema, useTemplates} from '../../hooks'
import {createDocumentPreviewStore, type DocumentPreviewStore} from '../../preview'
import {useSource, useWorkspace} from '../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {createKeyValueStore, type KeyValueStore} from '../key-value'
import {createRenderingContextStore} from '../renderingContext/createRenderingContextStore'
import {type RenderingContextStore} from '../renderingContext/types'
import {useCurrentUser} from '../user'
import {
  type ConnectionStatusStore,
  createConnectionStatusStore,
} from './connection-status/connection-status-store'
import {createDocumentStore, type DocumentStore, type LatencyReportEvent} from './document'
import {DocumentDesynced} from './document/__telemetry__/documentOutOfSyncEvents.telemetry'
import {HighListenerLatencyOccurred} from './document/__telemetry__/listenerLatency.telemetry'
import {fetchFeatureToggle} from './document/document-pair/utils/fetchFeatureToggle'
import {type OutOfSyncError} from './document/utils/sequentializeListenerEvents'
import {createGrantsStore, type GrantsStore} from './grants'
import {createHistoryStore, type HistoryStore} from './history'
import {createPresenceStore, type PresenceStore} from './presence/presence-store'
import {createProjectStore, type ProjectStore} from './project'
import {useResourceCache} from './ResourceCacheProvider'
import {createUserStore, type UserStore} from './user'

/**
 * Latencies below this value will not be logged
 */
const IGNORE_LATENCY_BELOW_MS = 1000

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
      }) || createGrantsStore({client, userId: currentUser?.id || null})

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
  const workspace = useWorkspace()

  const serverActionsEnabled = useMemo(() => {
    const configFlag = workspace.__internal_serverDocumentActions?.enabled
    // If it's explicitly set, let it override the feature toggle
    return typeof configFlag === 'boolean'
      ? of(configFlag as boolean)
      : fetchFeatureToggle(getClient(DEFAULT_STUDIO_CLIENT_OPTIONS))
  }, [getClient, workspace.__internal_serverDocumentActions?.enabled])

  const telemetry = useTelemetry()

  const handleSyncErrorRecovery = useCallback(
    (error: OutOfSyncError) => {
      telemetry.log(DocumentDesynced, {errorName: error.name})
    },
    [telemetry],
  )

  const handleReportLatency = useCallback(
    (event: LatencyReportEvent) => {
      if (event.latencyMs > IGNORE_LATENCY_BELOW_MS) {
        telemetry.log(HighListenerLatencyOccurred, {
          latency: event.latencyMs,
          shard: event.shard,
          transactionId: event.transactionId,
        })
      }
    },
    [telemetry],
  )

  return useMemo(() => {
    const documentStore =
      resourceCache.get<DocumentStore>({
        namespace: 'documentStore',
        dependencies: [getClient, documentPreviewStore, historyStore, schema, i18n, workspace],
      }) ||
      createDocumentStore({
        getClient,
        documentPreviewStore,
        historyStore,
        initialValueTemplates: templates,
        schema,
        i18n,
        serverActionsEnabled,
        extraOptions: {
          onReportLatency: handleReportLatency,
          onSyncErrorRecovery: handleSyncErrorRecovery,
        },
      })

    resourceCache.set({
      namespace: 'documentStore',
      dependencies: [getClient, documentPreviewStore, historyStore, schema, i18n, workspace],
      value: documentStore,
    })

    return documentStore
  }, [
    resourceCache,
    getClient,
    documentPreviewStore,
    historyStore,
    schema,
    i18n,
    workspace,
    templates,
    serverActionsEnabled,
    handleReportLatency,
    handleSyncErrorRecovery,
  ])
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
      }) || createPresenceStore({bifur, connectionStatusStore, userStore})

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
export function useKeyValueStore(): KeyValueStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const keyValueStore =
      resourceCache.get<KeyValueStore>({
        dependencies: [workspace],
        namespace: 'KeyValueStore',
      }) || createKeyValueStore({client})

    resourceCache.set({
      dependencies: [workspace],
      namespace: 'KeyValueStore',
      value: keyValueStore,
    })

    return keyValueStore
  }, [client, resourceCache, workspace])
}

/** @internal */
export function useRenderingContextStore(): RenderingContextStore {
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const renderingContextStore =
      resourceCache.get<RenderingContextStore>({
        dependencies: [],
        namespace: 'RenderingContextStore',
      }) || createRenderingContextStore()

    resourceCache.set({
      dependencies: [],
      namespace: 'RenderingContextStore',
      value: renderingContextStore,
    })

    return renderingContextStore
  }, [resourceCache])
}
