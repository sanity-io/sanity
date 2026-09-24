import {useContext} from 'react'
import {MountedToolsContext} from 'sanity/_singletons'
import {type RouterState} from 'sanity/router'

/**
 * The root router state to restore when navigating to `toolName`, when that tool is kept mounted
 * while inactive (see `beta.reactActivityMode`). `undefined` for the active tool, for tools
 * that are not mounted, and when the feature is off.
 *
 * @internal
 */
export function useInactiveToolState(toolName: string): RouterState | undefined {
  return useContext(MountedToolsContext).inactiveToolStates.get(toolName)
}
