import {
  createBatchedStore,
  type CreateBatchedStoreOptions,
  createSessionId,
} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  version as reactVersion,
} from 'react'
import {useRouterState} from 'sanity/router'

import {isProd} from '../../environment'
import {useClient} from '../../hooks/useClient'
import {useProjectOrganizationId} from '../../store/project/useProjectOrganizationId'
import {SANITY_VERSION} from '../../version'
import {
  collectWorkspaceFeatures,
  WorkspaceFeaturesObserved,
} from '../__telemetry__/featureAvailability.telemetry'
import {StudioLoaded} from '../__telemetry__/studioLoaded.telemetry'
import {useWorkspace} from '../workspace'
import {useWorkspaces} from '../workspaces/useWorkspaces'
import {PerformanceTelemetryTracker} from './PerformanceTelemetry'
import {type TelemetryContext} from './types'
import {debugLoggingStore} from './utils/debugLoggingStore'

const sessionId = createSessionId()

/** Telemetry only runs on client */
const isClient = typeof window !== 'undefined'

interface PluginWithNestedPlugins {
  plugins?: PluginWithNestedPlugins[]
}

interface BrowserConnection {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: BrowserConnection
  mozConnection?: BrowserConnection
  webkitConnection?: BrowserConnection
}

function countPlugins(plugins: PluginWithNestedPlugins[] | undefined): number {
  if (!plugins) return 0
  return plugins.reduce((count, plugin) => count + 1 + countPlugins(plugin.plugins), 0)
}

function getConnection(): TelemetryContext['connection'] {
  if (!isClient) return null

  const nav = navigator as NavigatorWithConnection
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection

  if (!connection) return null

  return {
    effectiveType: connection.effectiveType ?? null,
    downlink: typeof connection.downlink === 'number' ? connection.downlink : null,
    rtt: typeof connection.rtt === 'number' ? connection.rtt : null,
    saveData: typeof connection.saveData === 'boolean' ? connection.saveData : null,
  }
}

export function StudioTelemetryProvider(props: {children: ReactNode}) {
  const client = useClient({apiVersion: 'v2023-12-18'})
  const projectId = client.config().projectId

  // Get workspace context
  const workspace = useWorkspace()
  const workspaces = useWorkspaces()
  const workspaceCount = workspaces.length
  const workspacePlugins = workspace.__internal.options.plugins
  const workspaceSchema = workspace.schema

  // Get organization ID (async, may be null initially)
  const {value: orgId} = useProjectOrganizationId()

  // Get active tool from router state
  const activeTool = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  // Box latest client/project/context in a useState closure (not a ref) so the
  // store can be created once without a render-time ref read.
  const [telemetry] = useState(() => {
    let currentClient = client
    let currentProjectId = projectId
    let currentContext: TelemetryContext | null = null

    const debugTelemetry = import.meta && import.meta.env?.SANITY_STUDIO_DEBUG_TELEMETRY === 'true'

    const storeOptions: CreateBatchedStoreOptions = debugTelemetry
      ? debugLoggingStore
      : {
          flushInterval: 30000,
          resolveConsent: () =>
            currentClient.request({
              url: '/intake/telemetry-status',
              tag: 'telemetry-consent.studio',
            }),

          // Each event is enriched with the current context
          sendEvents: (batch) => {
            if (!isClient || !currentContext) return Promise.resolve()
            const context = currentContext
            const enrichedBatch = batch.map((event) => ({
              ...event,
              context,
            }))
            return currentClient.request({
              url: '/intake/batch',
              method: 'POST',
              body: {projectId: currentProjectId, batch: enrichedBatch},
            })
          },
          sendBeacon: (batch) => {
            if (!isClient || !currentContext) return false
            const context = currentContext
            const enrichedBatch = batch.map((event) => ({
              ...event,
              context,
            }))
            return navigator.sendBeacon(
              currentClient.getUrl('/intake/batch'),
              JSON.stringify({projectId: currentProjectId, batch: enrichedBatch}),
            )
          },
        }

    return {
      store: createBatchedStore(sessionId, storeOptions),
      sync(
        nextClient: typeof client,
        nextProjectId: typeof projectId,
        nextContext: TelemetryContext | null,
      ) {
        currentClient = nextClient
        currentProjectId = nextProjectId
        currentContext = nextContext
      },
    }
  })

  const context = useMemo((): TelemetryContext | null => {
    if (!isClient) return null
    const pluginCount = countPlugins(workspacePlugins)
    const schemaTypeCount = workspaceSchema.getTypeNames().length

    return {
      userAgent: navigator.userAgent,
      screen: {
        density: window.devicePixelRatio,
        height: window.screen.height,
        width: window.screen.width,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
      studioVersion: SANITY_VERSION,
      reactVersion,
      environment: isProd ? 'production' : 'development',
      connection: getConnection(),
      orgId: orgId || null,
      activeTool,
      workspaceCount,
      activeWorkspace: workspace.name,
      activeProjectId: workspace.projectId,
      activeDataset: workspace.dataset,
      pluginCount,
      schemaTypeCount,
    }
  }, [
    orgId,
    activeTool,
    workspaceCount,
    workspace.name,
    workspace.projectId,
    workspace.dataset,
    workspacePlugins,
    workspaceSchema,
  ])

  telemetry.sync(client, projectId, context)
  const {store} = telemetry

  // Per-instance guard so StrictMode's double-invoked mount effect logs StudioLoaded once.
  const studioLoadedFiredRef = useRef(false)
  useEffect(() => {
    if (!isClient || !context || studioLoadedFiredRef.current) return
    studioLoadedFiredRef.current = true
    store.logger.log(StudioLoaded, {
      studioVersion: SANITY_VERSION,
      reactVersion,
      environment: context.environment,
      userAgent: context.userAgent,
      screenDensity: context.screen.density,
      screenHeight: context.screen.height,
      screenWidth: context.screen.width,
      screenInnerHeight: context.screen.innerHeight,
      screenInnerWidth: context.screen.innerWidth,
    })
  }, [context, store.logger])

  const workspaceFeatures = useMemo(() => collectWorkspaceFeatures(workspace), [workspace])
  // Why: this component creates the TelemetryProvider, so `useTelemetry()` is
  // unavailable here. Log through `store.logger` directly. The ref dedupes
  // StrictMode's double-invoked mount effect per workspace while still
  // re-emitting when the active workspace changes.
  const observedFeaturesKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isClient) return
    const workspaceKey = `${workspace.projectId}:${workspace.name}`
    if (observedFeaturesKeyRef.current === workspaceKey) return
    observedFeaturesKeyRef.current = workspaceKey
    store.logger.log(WorkspaceFeaturesObserved, workspaceFeatures)
  }, [store.logger, workspace.name, workspace.projectId, workspaceFeatures])

  return (
    <TelemetryProvider store={store}>
      <PerformanceTelemetryTracker>{props.children}</PerformanceTelemetryTracker>
    </TelemetryProvider>
  )
}
