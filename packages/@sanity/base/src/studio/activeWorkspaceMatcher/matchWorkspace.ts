import {escapeRegExp} from 'lodash'

interface WorkspaceLike {
  name: string
  basePath?: string
}

interface ValidateWorkspaceBasePathsOptions {
  workspaces: WorkspaceLike[]
}

/**
 * Throws if the base paths in the given workspaces cannot be distinguished from
 * each other.
 */
export function validateWorkspaceBasePaths({workspaces}: ValidateWorkspaceBasePathsOptions): void {
  if (!workspaces.length) {
    throw new Error('At least one workspace is required.')
  }

  const normalized = workspaces.map(({name, basePath}) => ({name, basePath: basePath || '/'}))

  // check for a leading `/`, no trailing slash, and no invalid characters
  for (const workspace of normalized) {
    // by default, an empty basePath should be converted into a single `/` and
    // this case is fine
    if (workspace.basePath === '/') continue

    if (!/^\/[a-z0-9/_-]*[a-z0-9_-]+$/i.test(workspace.basePath)) {
      throw new Error(
        `All workspace \`basePath\`s must start with a leading \`/\`, ` +
          `consist of only URL safe characters, ` +
          `and cannot end with a trailing \`/\`. ` +
          `Workspace \`${workspace.name}\`'s basePath is \`${workspace.basePath}\``
      )
    }
  }

  const [firstWorkspace, ...restOfWorkspaces] = normalized
  const firstWorkspaceSegmentCount = firstWorkspace.basePath
    // remove starting slash before splitting
    .substring(1)
    .split('/').length

  for (const workspace of restOfWorkspaces) {
    const workspaceSegmentCount = workspace.basePath
      // remove starting slash before splitting
      .substring(1)
      .split('/').length

    if (firstWorkspaceSegmentCount !== workspaceSegmentCount) {
      throw new Error(
        `All workspace \`basePath\`s must have the same amount of segments. Workspace \`${
          firstWorkspace.name
        }\` had ${firstWorkspaceSegmentCount} segment${
          firstWorkspaceSegmentCount === 1 ? '' : 's'
        } \`${firstWorkspace.basePath}\` but workspace \`${
          workspace.name
        }\` had ${workspaceSegmentCount} segment${workspaceSegmentCount === 1 ? '' : 's'} \`${
          workspace.basePath
        }\``
      )
    }
  }

  const basePaths = new Map<string, string>()
  for (const workspace of normalized) {
    const basePath = workspace.basePath.toLowerCase()

    const existingWorkspace = basePaths.get(basePath)
    if (existingWorkspace) {
      throw new Error(
        `\`basePath\`s must be unique. Workspaces \`${existingWorkspace}\` and ` +
          `\`${workspace.name}\` both have the \`basePath\` \`${basePath}\``
      )
    }

    basePaths.set(basePath, workspace.name)
  }
}

interface MatchWorkspaceOptions<TWorkspace extends WorkspaceLike> {
  workspaces: TWorkspace[]
  pathname: string
}

type MatchWorkspaceResult<TWorkspace extends WorkspaceLike> =
  | {type: 'match'; workspace: TWorkspace}
  | {type: 'redirect'; pathname: string}
  | {type: 'not-found'}

/**
 * Given a pathname and a list of workspaces, returns either a workspace match,
 * a redirect, or not-found.
 *
 * Throws if the workspace `basePaths` could result in ambiguous matches.
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
  validateWorkspaceBasePaths({workspaces: normalized})

  const [firstWorkspace] = normalized
  for (const {workspace, basePath} of normalized) {
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    // e.g. if the `workspace.basePath` is `/base/foobar` and the current
    // pathname is `/base/foo`, then that should not be a match
    if (new RegExp(`^${escapeRegExp(basePath)}(\\/|$)`, 'i').test(pathname)) {
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
