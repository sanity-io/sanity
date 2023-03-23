import type {WorkspacesContextValue} from '../workspaces'
import type {NormalizedWorkspace} from './types'

/** @internal */
export interface MatchWorkspaceOptions {
  workspaces: NormalizedWorkspace[]
  pathname: string
  basePathRegex: RegExp
}

/** @internal */
export type MatchWorkspaceResult =
  | {type: 'match'; workspace: WorkspacesContextValue[number]}
  | {type: 'redirect'; pathname: string}
  | {type: 'not-found'}

/**
 * Given a pathname and a list of workspaces, returns either a workspace match,
 * a redirect, or not-found.
 *
 * @internal
 */
export function matchWorkspace({
  pathname,
  workspaces,
  basePathRegex,
}: MatchWorkspaceOptions): MatchWorkspaceResult {
  const [firstWorkspace] = workspaces
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

  // if the pathname is only a leading slash, then return a redirect
  if (pathname === '/') {
    return {type: 'redirect', pathname: firstWorkspace.basePath}
  }

  if (basePathRegex.test(pathname)) {
    // redirect to the first workspace configured
    return {type: 'redirect', pathname: firstWorkspace.basePath}
  }

  // if the pathname was not a subset of the common base path, then the route
  // the user is looking for is not present and we should show some sort of 404
  // screen
  return {type: 'not-found'}
}
