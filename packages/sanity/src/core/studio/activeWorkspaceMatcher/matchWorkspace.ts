import {escapeRegExp} from 'lodash'
import {WorkspaceLike} from '../workspaces'

/** @internal */
export interface MatchWorkspaceOptions<TWorkspace extends WorkspaceLike> {
  workspaces: TWorkspace[]
  pathname: string
}

/** @internal */
export type MatchWorkspaceResult<TWorkspace extends WorkspaceLike> =
  | {type: 'match'; workspace: TWorkspace}
  | {type: 'redirect'; pathname: string}
  | {type: 'not-found'}

/**
 * Given a pathname and a list of workspaces, returns either a workspace match,
 * a redirect, or not-found.
 *
 * Throws if the workspace `basePaths` could result in ambiguous matches.
 *
 * @internal
 */
export function matchWorkspace<TWorkspace extends WorkspaceLike>({
  pathname,
  workspaces,
}: MatchWorkspaceOptions<TWorkspace>): MatchWorkspaceResult<TWorkspace> {
  const normalized = workspaces.map((workspace) => ({
    workspace,
    name: workspace.name,
    basePath: workspace.basePath || '/',
  }))

  const [firstWorkspace] = normalized
  for (const {workspace, basePath} of normalized) {
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    // e.g. if the `workspace.basePath` is `/base/foobar` and the current
    // pathname is `/base/foo`, then that should not be a match
    if (new RegExp(`^${escapeRegExp(basePath)}(\\/|$)`, 'i').test(pathname) || basePath === '/') {
      return {type: 'match', workspace}
    }
  }

  const workspaceSegments = normalized.map((workspace) =>
    // gets the segments from the basePath
    workspace.basePath
      // removes the leading `/`
      .substring(1)
      .split('/')
  )

  // if the pathname is only a leading slash, then return a redirect
  if (pathname === '/') {
    return {type: 'redirect', pathname: firstWorkspace.basePath}
  }

  // this common base path is used to check if we should redirect. it's the base
  // path that is common between all the workspaces.
  const commonBasePath = workspaceSegments.reduce((commonSegments, segments) => {
    for (let i = 0; i < commonSegments.length; i++) {
      const commonSegment = commonSegments[i]
      const segment = segments[i].toLowerCase()

      if (commonSegment !== segment) {
        return commonSegments.slice(0, i)
      }
    }

    return commonSegments
  })

  // recursively creates a matching expression
  // `/foo/bar/baz` becomes `(\/foo(\/bar(\/baz(\/|$))?(\/|$))?(\/|$))?`
  function createCommonBasePathRegex([first, ...rest]: string[]): string {
    if (!first) return ''
    return `(\\/${escapeRegExp(first)}${createCommonBasePathRegex(rest)}(\\/|$))?`
  }

  if (new RegExp(`^${createCommonBasePathRegex(commonBasePath)}$`, 'i').test(pathname)) {
    // redirect to the first workspace configured
    return {type: 'redirect', pathname: firstWorkspace.basePath}
  }

  // if the pathname was not a subset of the common base path, then the route
  // the user is looking for is not present and we should show some sort of 404
  // screen
  return {type: 'not-found'}
}
