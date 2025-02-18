import {
  createBatchedStore,
  type CreateBatchedStoreOptions,
  createSessionId,
} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import arrify from 'arrify'
import {type ReactNode, useEffect, useMemo} from 'react'

import {type Config} from '../config'
import {useClient} from '../hooks'
import {SANITY_VERSION} from '../version'

const sessionId = createSessionId()

const DEBUG_TELEMETRY = !!(
  typeof process !== 'undefined' && process.env?.SANITY_STUDIO_DEBUG_TELEMETRY
)

/* eslint-disable no-console */
export const debugLoggingStore: CreateBatchedStoreOptions = {
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
/* eslint-enable no-console */

// Wrap the app in a TelemetryProvider
// This will enable usage of the `useTelemetry()` hook
export function StudioTelemetryProvider(props: {children: ReactNode; config: Config}) {
  const client = useClient({apiVersion: 'v2023-12-18'})

  const projectId = client.config().projectId

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
      sendEvents: (batch) =>
        client.request({
          uri: '/intake/batch',
          method: 'POST',
          json: true,
          body: {projectId, batch},
        }),
      // opts into a different strategy for sending events when the browser close, reload or navigate away from the current page
      sendBeacon: (batch) =>
        navigator.sendBeacon(client.getUrl('/intake/batch'), JSON.stringify({projectId, batch})),
    }
  }, [client, projectId])

  const store = useMemo(() => createBatchedStore(sessionId, storeOptions), [storeOptions])

  useEffect(() => {
    const workspaces = arrify(props.config)
    const projectIds: string[] = []
    const datasetNames: string[] = []
    const workspaceNames: string[] = []
    workspaces.forEach((workspace) => {
      projectIds.push(workspace.projectId)
      datasetNames.push(workspace.dataset)
      workspaceNames.push(workspace.name || '<unnamed>')
    })
    store.logger.updateUserProperties({
      userAgent: navigator.userAgent,
      screen: {
        density: window.devicePixelRatio,
        height: window.screen.height,
        width: window.screen.width,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
      studioVersion: SANITY_VERSION,
      plugins: workspaces.flatMap(
        (workspace) =>
          workspace.plugins?.flatMap((plugin) => ({
            name: plugin.name || '<unnamed>',
          })) || [],
      ),
      uniqueWorkspaceNames: new Set(workspaceNames).size,
      uniqueDatasetNames: new Set(datasetNames).size,
      workspaceNames,
      datasetNames,
    })
  }, [props.config, store.logger])

  return <TelemetryProvider store={store}>{props.children}</TelemetryProvider>
}
