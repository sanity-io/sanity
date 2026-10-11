import {capabilities as hostCapabilities, type MessageBusConnection} from '@sanity/sdk/dashboard'
import {map, type Observable, of, type OperatorFunction, startWith, switchMap} from 'rxjs'

import {type CapabilityRecord, type StudioRenderingContext} from './types'

const capabilitiesByRenderingContext: Record<
  Exclude<StudioRenderingContext['name'], 'messageBus'>,
  CapabilityRecord
> = {
  coreUi: {
    globalUserMenu: true,
    globalWorkspaceControl: true,
  },
  default: {},
}

const comlinkHost: CapabilityRecord = {
  ...Object.fromEntries(hostCapabilities.map((capability) => [capability, true])),
  comlink: true,
  dashboard: true,
}
const messageBusHost: CapabilityRecord = {messageBus: true, dashboard: true}

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
        ? {...capabilities, ...comlinkHost}
        : capabilities,
    )
  })
}

function messageBusCapabilities(connection: MessageBusConnection): Observable<CapabilityRecord> {
  return connection.subscribe('applications.capabilities').pipe(
    map((capabilities) => ({...capabilities, ...messageBusHost})),
    startWith(messageBusHost),
  )
}

function isRenderedInFrame(): boolean {
  return typeof window !== 'undefined' && window.self !== window.top
}
