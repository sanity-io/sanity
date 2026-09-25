import {type MessageBusConnection} from '@sanity/sdk/dashboard'
import {map, type Observable, of, type OperatorFunction, startWith, switchMap} from 'rxjs'

import {type CapabilityRecord, type StudioRenderingContext} from './types'

const capabilitiesByRenderingContext: Record<
  Exclude<StudioRenderingContext['name'], 'messageBus'>,
  CapabilityRecord
> = {
  coreUi: {
    globalUserMenu: true,
    globalWorkspaceControl: true,
    comlink: true,
  },
  default: {},
}

/**
 * @internal
 */
export function listCapabilities(): OperatorFunction<StudioRenderingContext, CapabilityRecord> {
  return switchMap((renderingContext) => {
    if (renderingContext.name === 'messageBus') {
      return messageBusCapabilities(renderingContext.metadata.connection)
    }

    const capabilities = capabilitiesByRenderingContext[renderingContext.name]
    // A `core-ui` URL opened outside a frame has no host to talk to.
    return of(
      renderingContext.name === 'coreUi' && isRenderedInFrame()
        ? {...capabilities, dashboard: true, favorites: true}
        : capabilities,
    )
  })
}

// The host publishes the capabilities it provides, and may change them at any time.
function messageBusCapabilities(connection: MessageBusConnection): Observable<CapabilityRecord> {
  return connection.subscribe('applications.capabilities').pipe(
    map((capabilities) => ({...capabilities, dashboard: true})),
    startWith({dashboard: true}),
  )
}

function isRenderedInFrame(): boolean {
  return typeof window !== 'undefined' && window.self !== window.top
}
