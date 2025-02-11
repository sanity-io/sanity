import {map, type OperatorFunction} from 'rxjs'

import {type CapabilityRecord, type StudioRenderingContext} from './types'

const capabilitiesByRenderingContext: Record<StudioRenderingContext['name'], CapabilityRecord> = {
  coreUi: {
    globalUserMenu: true,
    globalWorkspaceControl: true,
  },
  default: {},
}

/**
 * @internal
 */
export function listCapabilities(): OperatorFunction<StudioRenderingContext, CapabilityRecord> {
  return map((renderingContext) => capabilitiesByRenderingContext[renderingContext.name])
}
