import {escapeRegExp} from 'lodash'
import {useMemo} from 'react'
import type {WorkspacesContextValue} from '../workspaces'
import type {NormalizedWorkspace} from './types'

/** @internal */
export function useNormalizedWorkspaces(workspaces: WorkspacesContextValue): NormalizedWorkspace[] {
  return useMemo(
    () => normalizedWorkspaces(workspaces) satisfies NormalizedWorkspace[],
    [workspaces],
  )
}

/** @internal */
export function normalizedWorkspaces(workspaces: WorkspacesContextValue): NormalizedWorkspace[] {
  return workspaces.map((workspace) => {
    const basePath = workspace.basePath || '/'
    return {
      workspace,
      name: workspace.name,
      basePath,
      // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
      // matches where the pathname is a false subset of the current pathname.
      // e.g. if the `workspace.basePath` is `/base/foobar` and the current
      // pathname is `/base/foo`, then that should not be a match
      basePathRegex: new RegExp(`^${escapeRegExp(basePath)}(\\/|$)`, 'i'),
    } satisfies NormalizedWorkspace
  })
}
