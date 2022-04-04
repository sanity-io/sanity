import {WorkspaceOptions, Config} from './types'

export function createConfig(config: WorkspaceOptions | WorkspaceOptions[]): Config {
  return {type: 'sanity-config', __internal: config}
}
