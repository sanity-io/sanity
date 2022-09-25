import type {WorkspaceLike} from './types'
import {WorkspaceValidationError} from './WorkspaceValidationError'

interface ValidateWorkspaceOptions {
  workspaces: WorkspaceLike[]
}

export const getWorkspaceIdentifier = getIdentifier

/**
 * Validates workspace configuration, throwing if:
 *
 * - Workspaces do not all have base paths and names (if multiple given)
 * - Base paths or names are invalid
 * - Base paths or names are not unique
 */
export function validateWorkspaces({workspaces}: ValidateWorkspaceOptions): void {
  if (workspaces.length === 0) {
    throw new WorkspaceValidationError('At least one workspace is required.')
  }

  validateNames(workspaces)
  validateBasePaths(workspaces)
}

/**
 * Validates the workspace names of every workspace
 * Only exported for testing purposes
 *
 * @param workspaces - An array of workspaces
 * @internal
 */
export function validateNames(workspaces: WorkspaceLike[]): void {
  const isSingleWorkspace = workspaces.length === 1
  const names = new Map<string, {index: number; workspace: WorkspaceLike}>()
  workspaces.forEach((workspace, index) => {
    const {name: rawName, title} = workspace
    const thisIdentifier = getNamelessIdentifier(title, index)

    if (!rawName && !isSingleWorkspace) {
      throw new WorkspaceValidationError(
        'All workspaces must have a `name`, unless only a single workspace is defined. ' +
          `Workspace ${thisIdentifier} did not define a \`name\`.`,
        {workspace, index}
      )
    }

    const name = isSingleWorkspace && typeof rawName === 'undefined' ? 'default' : rawName

    if (typeof name !== 'string') {
      throw new WorkspaceValidationError(
        `Workspace at index ${index} defined an invalid \`name\` - must be a string.`,
        {workspace, index}
      )
    }

    const normalized = name.toLowerCase()
    const existingWorkspace = names.get(normalized)

    if (existingWorkspace) {
      const prevIdentifier = getNamelessIdentifier(
        existingWorkspace.workspace.title,
        existingWorkspace.index
      )
      throw new WorkspaceValidationError(
        `\`name\`s must be unique. Workspace ${prevIdentifier} and ` +
          `workspace ${thisIdentifier} both have the \`name\` \`${name}\``,
        {workspace, index}
      )
    }

    names.set(normalized, {index, workspace})

    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
      throw new WorkspaceValidationError(
        `All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, ` +
          `and cannot begin with an underscore or dash. ` +
          `Workspace ${thisIdentifier} has the invalid name \`${name}\``,
        {workspace, index}
      )
    }
  })
}

/**
 * Validates the base paths of every workspace
 * Only exported for testing purposes
 *
 * @param workspaces - An array of workspaces
 * @internal
 */
export function validateBasePaths(workspaces: WorkspaceLike[]): void {
  // If we have more than a single workspace, every workspace needs a basepath
  if (workspaces.length > 1) {
    workspaces.every(hasBasePath) // Throws on missing basePath
  }

  workspaces.every(validateBasePath)

  const [firstWorkspace, ...restOfWorkspaces] = workspaces
  const firstWorkspaceSegmentCount = (firstWorkspace.basePath || '/')
    // remove starting slash before splitting
    .substring(1)
    .split('/').length

  restOfWorkspaces.forEach((workspace, index) => {
    const workspaceSegmentCount = (workspace.basePath || '/')
      // remove starting slash before splitting
      .substring(1)
      .split('/').length

    if (firstWorkspaceSegmentCount !== workspaceSegmentCount) {
      throw new WorkspaceValidationError(
        `All workspace \`basePath\`s must have the same amount of segments. Workspace \`${getIdentifier(
          firstWorkspace,
          index
        )}\` had ${firstWorkspaceSegmentCount} segment${
          firstWorkspaceSegmentCount === 1 ? '' : 's'
        } \`${firstWorkspace.basePath}\` but workspace \`${getIdentifier(
          workspace,
          index
        )}\` had ${workspaceSegmentCount} segment${workspaceSegmentCount === 1 ? '' : 's'} \`${
          workspace.basePath
        }\``,
        {workspace, index}
      )
    }
  })

  const basePaths = new Map<string, string>()
  workspaces.forEach((workspace, index) => {
    const basePath = (workspace.basePath || '').toLowerCase()

    const existingWorkspace = basePaths.get(basePath)
    if (existingWorkspace) {
      throw new WorkspaceValidationError(
        `\`basePath\`s must be unique. Workspaces \`${existingWorkspace}\` and ` +
          `\`${getIdentifier(workspace, index)}\` both have the \`basePath\` \`${basePath}\``,
        {workspace, index}
      )
    }

    basePaths.set(basePath, getIdentifier(workspace, index))
  })
}

function hasBasePath(workspace: WorkspaceLike, index: number) {
  const {name, basePath} = workspace
  if (basePath && typeof basePath === 'string') {
    return true
  }

  if (typeof basePath === 'undefined') {
    throw new WorkspaceValidationError(
      `If more than one workspace is defined, every workspace must have a \`basePath\` defined. ` +
        `Workspace \`${name}\` is missing a \`basePath\``,
      {workspace, index}
    )
  }

  throw new WorkspaceValidationError(
    `If more than one workspace is defined, every workspace must have a \`basePath\` defined. ` +
      `Workspace \`${name}\` has an invalid \`basePath\` (must be a non-empty string)`,
    {workspace, index}
  )
}

function validateBasePath(workspace: WorkspaceLike, index: number) {
  const {name, basePath} = workspace

  // Empty base paths are okay (we're validating uniqueness and presence on more
  // than a single workspace in `validateBasePaths`)
  if (!basePath || basePath === '/') {
    return
  }

  if (!/^\/[a-z0-9/_-]*[a-z0-9_-]+$/i.test(basePath)) {
    throw new WorkspaceValidationError(
      `All workspace \`basePath\`s must start with a leading \`/\`, ` +
        `consist of only URL safe characters, ` +
        `and cannot end with a trailing \`/\`. ` +
        `Workspace \`${name}\`'s basePath is \`${basePath}\``,
      {workspace, index}
    )
  }
}

/**
 * Gets a printable identifer for the workspace - either the name, or the index
 * and any potential title set for it
 *
 * @param workspace - The workspace to get the indentifier for
 * @param index - The index at which the workspace appeared in the source array
 * @returns Printable string (eg `intranet`, or `at index 5 (titled "Intranet")`)
 * @internal
 */
function getIdentifier({name, title}: WorkspaceLike, index: number): string {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return getNamelessIdentifier(title, index)
}

function getNamelessIdentifier(title: string | undefined, index: number): string {
  const withTitle =
    typeof title === 'string' && title.trim().length > 0 ? ` (titled "${title}")` : ''
  return `at index ${index}${withTitle}`
}
