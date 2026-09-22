import {useMemo, useState} from 'react'
import {type RouterState, useRouter} from 'sanity/router'

import {type Tool} from '../../config/types'
import {type MountedTool, updateMountedTools} from './mountedTools'
import {type MountedToolsContextValue} from './types'

const NONE: MountedTool[] = []

interface UseMountedToolsOptions {
  /** `beta.keepInactiveToolsMounted.enabled`; while false, nothing is tracked. */
  enabled: boolean
  tools: Tool[]
  activeTool: Tool | undefined
}

interface UseMountedToolsResult {
  /** Least recently used first; the active tool, when there is one, is the last entry. */
  mountedTools: MountedTool[]
  /** Value for `MountedToolsContext`, consumed by `ToolLink`. */
  contextValue: MountedToolsContextValue
}

/**
 * Tracks the tools that stay mounted while inactive (see `beta.keepInactiveToolsMounted`), each
 * with the root router context it last rendered with while active.
 *
 * @internal
 */
export function useMountedTools(options: UseMountedToolsOptions): UseMountedToolsResult {
  const {enabled, tools, activeTool} = options
  const router = useRouter()
  const [mounted, setMounted] = useState(NONE)

  // The list is derived from the previous list plus this render's router, so it is adjusted
  // during render (React's "storing information from previous renders" pattern) rather than in
  // an effect. This way the tool that just became inactive keeps its frozen router context in
  // the same render that hides it; an effect would first commit it with the new tool's state.
  const mountedTools = enabled ? updateMountedTools(mounted, {tools, activeTool, router}) : NONE
  if (mountedTools !== mounted) {
    setMounted(mountedTools)
  }

  const contextValue = useMemo<MountedToolsContextValue>(() => {
    const inactiveToolStates: Record<string, RouterState> = {}
    for (const entry of mountedTools) {
      if (entry.tool !== activeTool) {
        inactiveToolStates[entry.tool.name] = entry.router.state
      }
    }
    return {inactiveToolStates}
  }, [activeTool, mountedTools])

  return {mountedTools, contextValue}
}
