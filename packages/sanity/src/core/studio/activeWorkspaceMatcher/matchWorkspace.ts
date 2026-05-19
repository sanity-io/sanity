import {type WorkspaceAuthStates} from '../components/navbar/workspace/hooks'
import {type WorkspacesContextValue} from '../workspaces'
import {evaluateWorkspaceHidden} from '../workspaces/useVisibleWorkspaces'
import {type NormalizedWorkspace} from './types'

/** @internal */
export interface MatchWorkspaceOptions {
  workspaces: NormalizedWorkspace[]
  pathname: string
  basePathRegex: RegExp
  workspaceAuthStates: WorkspaceAuthStates
}

/** @internal */
export type MatchWorkspaceResult =
  | {type: 'match'; workspace: WorkspacesContextValue[number]}
  | {type: 'redirect'; pathname: string}
  | {type: 'not-found'}
  | {type: 'loading'}

/**
 * Resolves a pathname against the configured workspaces. Returns a match for a
 * known workspace path, a redirect to the first visible workspace when the
 * pathname is the common base path, or not-found otherwise.
 *
 * The default redirect walks workspaces in config order, skipping any with
 * `hidden: true` or with a `hidden()` callback that returns `true`. It returns
 * `loading` only when a function-hidden workspace is reached whose auth state
 * has not yet resolved. If every workspace is hidden, it falls back to the
 * first configured workspace.
 *
 * @internal
 */
export function matchWorkspace({
  pathname,
  workspaces,
  basePathRegex,
  workspaceAuthStates,
}: MatchWorkspaceOptions): MatchWorkspaceResult {
  if (workspaces.length === 0) return {type: 'not-found'}
  // eslint-disable-next-line @typescript-eslint/no-shadow
  for (const {workspace, basePath, basePathRegex} of workspaces) {
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    // e.g. if the `workspace.basePath` is `/base/foobar` and the current
    // pathname is `/base/foo`, then that should not be a match
    if (basePathRegex.test(pathname) || basePath === '/') {
      return {type: 'match', workspace}
    }
  }

  if (pathname === '/' || basePathRegex.test(pathname)) {
    for (const {workspace, basePath} of workspaces) {
      const {hidden} = workspace
      if (hidden === true) continue
      if (typeof hidden === 'function') {
        const authState = workspaceAuthStates[workspace.name]
        if (authState === undefined) return {type: 'loading'}
        if (evaluateWorkspaceHidden(workspace, authState)) continue
      }
      return {type: 'redirect', pathname: basePath}
    }
    // Every workspace is hidden; fall back to the first configured one.
    return {type: 'redirect', pathname: workspaces[0].basePath}
  }

  // if the pathname was not a subset of the common base path, then the route
  // the user is looking for is not present and we should show some sort of 404
  // screen
  return {type: 'not-found'}
}
