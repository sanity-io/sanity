import {
  createBatchedStore,
  type CreateBatchedStoreOptions,
  createSessionId,
} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import arrify from 'arrify'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, version as reactVersion} from 'react'
import {useRouterState} from 'sanity/router'

import {type Config} from '../../config'
import {isProd} from '../../environment'
import {useClient} from '../../hooks'
import {useProjectOrganizationId} from '../../store/_legacy/project/useProjectOrganizationId'
import {SANITY_VERSION} from '../../version'
import {useWorkspace} from '../workspace'
import {PerformanceTelemetryTracker} from './PerformanceTelemetry'

const sessionId = createSessionId()

/**
 * Context that enriches telemetry events with Studio-specific information
 */
interface TelemetryContext {
  // Static context (doesn't change during session)
  userAgent: string
  screen: {
    density: number
    height: number
    width: number
    innerHeight: number
    innerWidth: number
  }
  environment: 'production' | 'development'
  studioVersion: string
  reactVersion: string

  // Dynamic context (changes during session)
  orgId: string | null
  activeWorkspace: string | null
  activeProjectId: string | null
  activeDataset: string | null
  activeTool: string | null

  // Config-derived context
  workspaceNames: string[]
  datasetNames: string[]
  projectIds: string[]
}

const DEBUG_TELEMETRY = !!(
  typeof process !== 'undefined' && process.env?.SANITY_STUDIO_DEBUG_TELEMETRY
)

// oxlint-disable no-console
const debugLoggingStore: CreateBatchedStoreOptions = {
  // submit any pending events every <n> ms
  flushInterval: 1000,

  // implements user consent resolving
  resolveConsent: () => Promise.resolve({status: 'granted'}),

  // implements sending events to backend
  sendEvents: async (batch) => {
    console.log('[telemetry] submit events (noop): %O', batch)
  },
  // opts into a different strategy for sending events when the browser close, reload or navigate away from the current page
  sendBeacon: (batch) => {
    console.log('[telemetry] submit events (noop): %O', batch)
    return true
  },
}
// oxlint-enable no-console

// Wrap the app in a TelemetryProvider
// This will enable usage of the `useTelemetry()` hook
export function StudioTelemetryProvider(props: {children: ReactNode; config: Config}) {
  const client = useClient({apiVersion: 'v2023-12-18'})
  const projectId = client.config().projectId

  // Get workspace context
  const workspace = useWorkspace()

  // Get organization ID (async)
  const {value: orgId} = useProjectOrganizationId()

  // Get active tool from router state
  const activeTool = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : null),
      [],
    ),
  )

  // Extract config-derived values
  const configContext = useMemo(() => {
    const workspaces = arrify(props.config)
    const projectIds: string[] = []
    const datasetNames: string[] = []
    const workspaceNames: string[] = []
    workspaces.forEach((ws) => {
      projectIds.push(ws.projectId)
      datasetNames.push(ws.dataset)
      workspaceNames.push(ws.name || '<unnamed>')
    })
    return {projectIds, datasetNames, workspaceNames}
  }, [props.config])

  // Ref to hold current telemetry context (used by sendEvents callback)
  const contextRef = useRef<TelemetryContext>({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    screen: {
      density: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      height: typeof window !== 'undefined' ? window.screen.height : 0,
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      innerHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      innerWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    },
    environment: isProd ? 'production' : 'development',
    studioVersion: SANITY_VERSION,
    reactVersion,
    orgId: null,
    activeWorkspace: null,
    activeProjectId: null,
    activeDataset: null,
    activeTool: null,
    workspaceNames: [],
    datasetNames: [],
    projectIds: [],
  })

  // Update context ref when dynamic values change
  useEffect(() => {
    contextRef.current = {
      // Static context
      userAgent: navigator.userAgent,
      screen: {
        density: window.devicePixelRatio,
        height: window.screen.height,
        width: window.screen.width,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
      environment: isProd ? 'production' : 'development',
      studioVersion: SANITY_VERSION,
      reactVersion,

      // Dynamic context
      orgId,
      activeWorkspace: workspace?.name ?? null,
      activeProjectId: workspace?.projectId ?? null,
      activeDataset: workspace?.dataset ?? null,
      activeTool,

      // Config-derived context
      ...configContext,
    }
  }, [orgId, workspace, activeTool, configContext])

  const storeOptions = useMemo((): CreateBatchedStoreOptions => {
    if (DEBUG_TELEMETRY) {
      return debugLoggingStore
    }
    return {
      // submit any pending events every <n> ms
      flushInterval: 30000,

      // implements user consent resolving
      resolveConsent: () =>
        client.request({uri: '/intake/telemetry-status', tag: 'telemetry-consent.studio'}),

      // implements sending events to backend
      sendEvents: (batch) => {
        // Enrich each event with current context
        const context = contextRef.current
        const enrichedBatch = batch.map((event) => ({
          ...event,
          context,
        }))
        return client.request({
          uri: '/intake/batch',
          method: 'POST',
          json: true,
          body: {projectId, batch: enrichedBatch},
        })
      },
      // opts into a different strategy for sending events when the browser close, reload or navigate away from the current page
      sendBeacon: (batch) => {
        // Enrich each event with current context
        const context = contextRef.current
        const enrichedBatch = batch.map((event) => ({
          ...event,
          context,
        }))
        return navigator.sendBeacon(
          client.getUrl('/intake/batch'),
          JSON.stringify({projectId, batch: enrichedBatch}),
        )
      },
    }
  }, [client, projectId])

  const store = useMemo(() => createBatchedStore(sessionId, storeOptions), [storeOptions])

  // Update user properties (these are session-level, not per-event)
  useEffect(() => {
    const workspaces = arrify(props.config)
    store.logger.updateUserProperties({
      userAgent: navigator.userAgent,
      screen: {
        density: window.devicePixelRatio,
        height: window.screen.height,
        width: window.screen.width,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
      reactVersion,
      studioVersion: SANITY_VERSION,
      plugins: workspaces.flatMap(
        (workspace) =>
          workspace.plugins?.flatMap((plugin) => ({
            name: plugin.name || '<unnamed>',
          })) || [],
      ),
      uniqueWorkspaceNames: new Set(configContext.workspaceNames).size,
      uniqueDatasetNames: new Set(configContext.datasetNames).size,
      workspaceNames: configContext.workspaceNames,
      datasetNames: configContext.datasetNames,
    })
  }, [props.config, store.logger, configContext])

  return (
    <TelemetryProvider store={store}>
      <PerformanceTelemetryTracker>{props.children}</PerformanceTelemetryTracker>
    </TelemetryProvider>
  )
}
