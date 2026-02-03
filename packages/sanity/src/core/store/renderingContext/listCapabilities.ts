import {type CapabilityRecord, type StudioRenderingContext} from './types'
import {map, type OperatorFunction} from 'rxjs'

const capabilitiesByRenderingContext: Record<StudioRenderingContext['name'], CapabilityRecord> = {
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
  return map((renderingContext) => capabilitiesByRenderingContext[renderingContext.name])
}
