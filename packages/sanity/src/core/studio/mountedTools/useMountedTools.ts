import {useMemo, useState} from 'react'
import {type RouterState, useRouter} from 'sanity/router'

import {type Tool} from '../../config/types'
import {type MountedTool, updateMountedTools} from './mountedTools'
import {type MountedToolsContextValue} from './types'

const NONE: MountedTool[] = []

interface UseMountedToolsOptions {
  /** `beta.reactActivityMode`; while false, nothing is tracked. */
  enabled: boolean
  tools: Tool[]
  activeTool: Tool | undefined
}

interface UseMountedToolsResult {
  /**
   * The tools to render, in workspace `tools` order. The order is deliberately not the
   * least-recently-used order used for eviction: reordering keyed children makes React move their
   * DOM nodes, and re-inserting an `<iframe>` (Presentation's preview) reloads it.
   */
  mountedTools: MountedTool[]
  /** Value for `MountedToolsContext`, consumed by `ToolLink`. */
  contextValue: MountedToolsContextValue
}

/**
 * Tracks the tools that stay mounted while inactive (see `beta.reactActivityMode`), each
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
  const next = enabled ? updateMountedTools(mounted, {tools, activeTool, router}) : NONE
  if (next !== mounted) {
    setMounted(next)
  }

  const mountedTools = useMemo(() => {
    const position = (entry: MountedTool) =>
      tools.findIndex((tool) => tool.name === entry.tool.name)
    return next.toSorted((a, b) => position(a) - position(b))
  }, [next, tools])

  const contextValue = useMemo<MountedToolsContextValue>(() => {
    const inactiveToolStates = new Map<string, RouterState>()
    for (const entry of next) {
      if (entry.tool.name !== activeTool?.name) {
        inactiveToolStates.set(entry.tool.name, entry.router.state)
      }
    }
    return {inactiveToolStates}
  }, [activeTool, next])

  return {mountedTools, contextValue}
}
