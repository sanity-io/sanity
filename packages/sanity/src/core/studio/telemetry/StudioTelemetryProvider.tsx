import {
  createBatchedStore,
  type CreateBatchedStoreOptions,
  createSessionId,
} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import {type ReactNode, useEffect, useMemo, useRef, version as reactVersion} from 'react'
import {useRouterState} from 'sanity/router'

import {isProd} from '../../environment'
import {useClient} from '../../hooks'
import {useProjectOrganizationId} from '../../store/_legacy/project/useProjectOrganizationId'
import {SANITY_VERSION} from '../../version'
import {useWorkspace} from '../workspace'
import {PerformanceTelemetryTracker} from './PerformanceTelemetry'
import {type TelemetryContext} from './types'

const sessionId = createSessionId()

const DEBUG_TELEMETRY = !!(
  typeof process !== 'undefined' && process.env?.SANITY_STUDIO_DEBUG_TELEMETRY
)

/**
 * Get initial context values, handling SSR where window is not available
 */
function getInitialContext(): TelemetryContext {
  const isSSR = typeof window === 'undefined'

  return {
    // Static
    userAgent: isSSR ? '' : navigator.userAgent,
    screen: isSSR
      ? {density: 1, height: 0, width: 0, innerHeight: 0, innerWidth: 0}
      : {
          density: window.devicePixelRatio,
          height: window.screen.height,
          width: window.screen.width,
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
        },
    studioVersion: SANITY_VERSION,
    reactVersion,
    environment: isProd ? 'production' : 'development',

    // Dynamic (will be updated)
    orgId: null,
    activeTool: undefined,
    activeWorkspace: '',
    activeProjectId: '',
    activeDataset: '',
  }
}

// oxlint-disable no-console
const debugLoggingStore: CreateBatchedStoreOptions = {
  flushInterval: 1000,
  resolveConsent: () => Promise.resolve({status: 'granted'}),
  sendEvents: async (batch) => {
    console.log('[telemetry] submit events (noop): %O', batch)
  },
  sendBeacon: (batch) => {
    console.log('[telemetry] submit events (noop): %O', batch)
    return true
  },
}
// oxlint-enable no-console

export function StudioTelemetryProvider(props: {children: ReactNode}) {
  const client = useClient({apiVersion: 'v2023-12-18'})
  const projectId = client.config().projectId

  // Get workspace context
  const workspace = useWorkspace()

  // Get organization ID (async, may be null initially)
  const {value: orgId} = useProjectOrganizationId()

  // Get active tool from router state
  const activeTool = useRouterState(
    (routerState) => routerState?.tool,
    (a, b) => a === b,
  )

  // Ref to hold current context - allows sendEvents to always access latest values
  // without causing re-memoization of the store
  const contextRef = useRef<TelemetryContext>(getInitialContext())

  // Update context ref when any dynamic values change
  // Using direct assignment (not useEffect) ensures context is always current
  contextRef.current = {
    // Static values
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    screen:
      typeof window !== 'undefined'
        ? {
            density: window.devicePixelRatio,
            height: window.screen.height,
            width: window.screen.width,
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth,
          }
        : {density: 1, height: 0, width: 0, innerHeight: 0, innerWidth: 0},
    studioVersion: SANITY_VERSION,
    reactVersion,
    environment: isProd ? 'production' : 'development',

    // Dynamic values
    orgId: orgId || null,
    activeTool,
    activeWorkspace: workspace.name,
    activeProjectId: workspace.projectId,
    activeDataset: workspace.dataset,
  }

  const storeOptions = useMemo((): CreateBatchedStoreOptions => {
    if (DEBUG_TELEMETRY) {
      return debugLoggingStore
    }
    return {
      flushInterval: 30000,
      resolveConsent: () =>
        client.request({uri: '/intake/telemetry-status', tag: 'telemetry-consent.studio'}),

      // Each event is enriched with the current context
      sendEvents: (batch) => {
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
      sendBeacon: (batch) => {
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

  // Also update user properties on the store (for backwards compatibility)
  useEffect(() => {
    store.logger.updateUserProperties({
      userAgent: contextRef.current.userAgent,
      screen: contextRef.current.screen,
      reactVersion,
      studioVersion: SANITY_VERSION,
      environment: contextRef.current.environment,
    })
  }, [store.logger])

  return (
    <TelemetryProvider store={store}>
      <PerformanceTelemetryTracker>{props.children}</PerformanceTelemetryTracker>
    </TelemetryProvider>
  )
}
