import {type SanityClient} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient, useSchema, useTemplates} from '../hooks'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {createDocumentPreviewStore, type DocumentPreviewStore} from '../preview'
import {useSource, useWorkspace} from '../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {createComlinkStore} from './comlink/createComlinkStore'
import {type ComlinkStore} from './comlink/types'
import {
  type ConnectionStatusStore,
  createConnectionStatusStore,
} from './connection-status/connection-status-store'
import {
  createDocumentStore,
  type DocumentPairLoadedEvent,
  type DocumentRebaseTelemetryEvent,
  type DocumentStore,
  type LatencyReportEvent,
  type MutationPerformanceEvent,
} from './document'
import {DocumentDesynced} from './document/__telemetry__/documentOutOfSyncEvents.telemetry'
import {DocumentPairLoadingMeasured} from './document/__telemetry__/documentPairLoading.telemetry'
import {DocumentRebaseOccurred} from './document/__telemetry__/documentRebase.telemetry'
import {HighListenerLatencyOccurred} from './document/__telemetry__/listenerLatency.telemetry'
import {MutationPerformanceMeasured} from './document/__telemetry__/mutationPerformance.telemetry'
import {type OutOfSyncError} from './document/utils/sequentializeListenerEvents'
import {createGrantsStore, type GrantsStore} from './grants'
import {createHistoryStore, type HistoryStore} from './history'
import {createKeyValueStore, type KeyValueStore} from './key-value'
import {createPresenceStore, type PresenceStore} from './presence/presence-store'
import {createProjectStore, type ProjectStore} from './project'
import {createRenderingContextStore} from './renderingContext/createRenderingContextStore'
import {type RenderingContextStore} from './renderingContext/types'
import {useResourceCache} from './ResourceCacheProvider'
import {useCurrentUser} from './user'
import {createUserStore, type UserStore} from './user/userStore'

/**
 * Latencies below this value will not be logged
 */
const IGNORE_LATENCY_BELOW_MS = 1000

/** Minimum time between slow commit toast notifications */
const SLOW_COMMIT_TOAST_COOLDOWN_MS = 30_000
const slowCommitCooldown = {lastToastAt: 0}

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
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()
  const templates = useTemplates()
  const resourceCache = useResourceCache()
  const historyStore = useHistoryStore()
  const documentPreviewStore = useDocumentPreviewStore()
  const workspace = useWorkspace()
  const telemetry = useTelemetry()
  const toast = useToast()
  const {t} = useTranslation()

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

  const handleSlowCommit = useCallback(() => {
    const now = Date.now()
    if (now - slowCommitCooldown.lastToastAt < SLOW_COMMIT_TOAST_COOLDOWN_MS) return
    slowCommitCooldown.lastToastAt = now
    toast.push({
      title: t('document-store.slow-commit.title'),
      description: t('document-store.slow-commit.description'),
      status: 'warning',
    })
  }, [toast, t])

  const handleDocumentPairLoaded = useCallback(
    (event: DocumentPairLoadedEvent) => {
      telemetry.log(DocumentPairLoadingMeasured, {
        durationMs: event.durationMs,
        fromCache: event.fromCache,
        hasPublished: event.hasPublished,
        hasDraft: event.hasDraft,
        hasVersion: event.hasVersion,
      })
    },
    [telemetry],
  )

  const handleReportMutationPerformance = useCallback(
    (event: MutationPerformanceEvent) => {
      telemetry.log(MutationPerformanceMeasured, event)
    },
    [telemetry],
  )

  const handleDocumentRebase = useCallback(
    (event: DocumentRebaseTelemetryEvent) => {
      telemetry.log(DocumentRebaseOccurred, event)
    },
    [telemetry],
  )

  return useMemo(() => {
    const documentStore =
      resourceCache.get<DocumentStore>({
        namespace: 'documentStore',
        dependencies: [
          getClient,
          documentPreviewStore,
          historyStore,
          schema,
          i18n,
          workspace,
          currentUser,
        ],
      }) ||
      createDocumentStore({
        getClient,
        documentPreviewStore,
        historyStore,
        initialValueTemplates: templates,
        schema,
        i18n,
        currentUser,
        extraOptions: {
          onReportLatency: handleReportLatency,
          onSyncErrorRecovery: handleSyncErrorRecovery,
          onSlowCommit: handleSlowCommit,
          onDocumentPairLoaded: handleDocumentPairLoaded,
          onReportMutationPerformance: handleReportMutationPerformance,
          onDocumentRebase: handleDocumentRebase,
        },
      })

    resourceCache.set({
      namespace: 'documentStore',
      dependencies: [
        getClient,
        documentPreviewStore,
        historyStore,
        schema,
        i18n,
        workspace,
        currentUser,
      ],
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
    currentUser,
    templates,
    handleReportLatency,
    handleSyncErrorRecovery,
    handleSlowCommit,
    handleDocumentPairLoaded,
    handleReportMutationPerformance,
    handleDocumentRebase,
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

/**
 * Module-level cache for KeyValueStore instances, keyed by project identity.
 * Uses a simple Map with string keys since the ResourceCache's WeakMap
 * doesn't support primitive-based cache keys.
 */
const keyValueStoreCache = new Map<string, KeyValueStore>()

/**
 * Generates a cache key for KeyValueStore based on project identity.
 * The /users/me/keyvalue endpoint is project-scoped, so we only need
 * projectId and apiHost (not dataset) to identify unique stores.
 */
function getKeyValueStoreCacheKey(client: SanityClient): string {
  const config = client.config()
  return `${config.projectId}:${config.apiHost || 'default'}`
}

/**
 * Returns a KeyValueStore instance for storing user preferences.
 *
 * The store is cached by project identity (projectId + apiHost) rather than
 * workspace, because the /users/me/keyvalue endpoint is project-scoped -
 * user preferences are shared across all datasets within a project.
 *
 * @internal
 */
export function useKeyValueStore(): KeyValueStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const cacheKey = getKeyValueStoreCacheKey(client)
    const cached = keyValueStoreCache.get(cacheKey)
    if (cached) return cached

    const keyValueStore = createKeyValueStore({client})
    keyValueStoreCache.set(cacheKey, keyValueStore)
    return keyValueStore
  }, [client])
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

/** @internal */
export function useComlinkStore(): ComlinkStore {
  const resourceCache = useResourceCache()
  const renderingContext = useRenderingContextStore()
  const capabilities = useObservable(renderingContext.capabilities, {})

  return useMemo(() => {
    const comlinkStore =
      resourceCache.get<ComlinkStore>({
        dependencies: [capabilities],
        namespace: 'ComlinkStore',
      }) || createComlinkStore({capabilities})

    resourceCache.set({
      dependencies: [capabilities],
      namespace: 'ComlinkStore',
      value: comlinkStore,
    })

    return comlinkStore
  }, [capabilities, resourceCache])
}
