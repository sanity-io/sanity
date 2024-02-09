import {createBatchedStore, createSessionId} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import arrify from 'arrify'
import {type ReactNode, useEffect, useMemo} from 'react'

import {type Config} from '../config'
import {useClient} from '../hooks'
import {SANITY_VERSION} from '../version'

const sessionId = createSessionId()

// Wrap the app in a TelemetryProvider
// This will enable usage of the `useTelemetry()` hook
export function StudioTelemetryProvider(props: {children: ReactNode; config: Config}) {
  const client = useClient({apiVersion: 'v2023-12-18'})

  const projectId = client.config().projectId
  const store = useMemo(() => {
    return createBatchedStore(sessionId, {
      // submit any pending events every <n> ms
      flushInterval: 30000,

      // implements user consent resolving
      resolveConsent: () => client.request({uri: '/intake/telemetry-status'}),

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
    })
  }, [client, projectId])

  useEffect(() => {
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
      plugins: arrify(props.config).flatMap(
        (config) =>
          config.plugins?.flatMap((plugin) => ({
            name: plugin.name || '<unnamed>',
          })) || [],
      ),
    })
  }, [props.config, store.logger])

  return <TelemetryProvider store={store}>{props.children}</TelemetryProvider>
}
