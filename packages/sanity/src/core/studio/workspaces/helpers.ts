import {WorkspaceLike} from './types'

/**
 * Gets a printable identifer for the workspace - either the name, or the index
 * and any potential title set for it
 *
 * @param workspace - The workspace to get the indentifier for
 * @param index - The index at which the workspace appeared in the source array
 * @returns Printable string (eg `intranet`, or `at index 5 (titled "Intranet")`)
 * @internal
 */
export function getWorkspaceIdentifier({name, title}: WorkspaceLike, index: number): string {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return getNamelessWorkspaceIdentifier(title, index)
}

/** @internal */
export function getNamelessWorkspaceIdentifier(title: string | undefined, index: number): string {
  const withTitle =
    typeof title === 'string' && title.trim().length > 0 ? ` (titled "${title}")` : ''
  return `at index ${index}${withTitle}`
}
