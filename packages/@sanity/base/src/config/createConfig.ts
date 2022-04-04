import {WorkspaceOptions, SanityConfig} from './types'

export function createConfig(config: WorkspaceOptions | WorkspaceOptions[]): SanityConfig {
  return {type: 'sanity-config', __internal: config}
}
