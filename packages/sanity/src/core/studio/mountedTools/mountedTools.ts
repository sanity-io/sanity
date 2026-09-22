import {type RouterContextValue} from 'sanity/router'

import {type Tool} from '../../config/types'

/**
 * How many tools stay mounted at once when `beta.keepInactiveToolsMounted` is enabled: the active
 * tool plus the two most recently used before it.
 */
export const MAX_MOUNTED_TOOLS = 3

/**
 * A tool that is kept mounted, together with the root router context it last rendered with while
 * it was the active tool. Inactive tools keep rendering with that frozen context, so their URL
 * state (and everything derived from it) stays put until they become active again.
 *
 * @internal
 */
export interface MountedTool {
  tool: Tool
  router: RouterContextValue
}

interface UpdateMountedToolsOptions {
  /** The workspace's tools; mounted entries for tools no longer in this list are dropped. */
  tools: Tool[]
  activeTool: Tool | undefined
  /** The root router context of the current render. */
  router: RouterContextValue
  limit?: number
}

/**
 * Moves `activeTool` to the end of the list with the current `router` recorded on it, keeping at
 * most `limit` entries (least recently used first). Returns `mounted` itself when nothing changed,
 * so the result can be compared by reference and the update applied during render.
 *
 * Membership and identity are by `tool.name`: `resolveSource` rebuilds the `tools` array (new
 * objects, same names) whenever `auth.state` emits, so comparing by object identity would drop
 * every hidden tool on a refresh. When a name still exists, the stored `tool` reference is
 * refreshed to the current object from `tools`.
 *
 * @internal
 */
export function updateMountedTools(
  mounted: MountedTool[],
  options: UpdateMountedToolsOptions,
): MountedTool[] {
  const {tools, activeTool, router, limit = MAX_MOUNTED_TOOLS} = options
  const activeName = activeTool?.name

  const next: MountedTool[] = []
  for (const entry of mounted) {
    if (entry.tool.name === activeName) continue
    const tool = tools.find((candidate) => candidate.name === entry.tool.name)
    if (!tool) continue
    next.push(entry.tool === tool ? entry : {tool, router: entry.router})
  }

  if (activeTool) {
    const current = mounted.find((entry) => entry.tool.name === activeTool.name)
    next.push(
      current?.router === router && current.tool === activeTool
        ? current
        : {tool: activeTool, router},
    )
  }

  const limited = next.length > limit ? next.slice(next.length - limit) : next

  return isSameList(mounted, limited) ? mounted : limited
}

function isSameList(a: MountedTool[], b: MountedTool[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index])
}
