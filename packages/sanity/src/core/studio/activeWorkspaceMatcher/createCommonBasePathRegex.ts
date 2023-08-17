import {escapeRegExp} from 'lodash'
import type {NormalizedWorkspace} from './types'

/**
 * Recursively creates a matching expression.
 * A list over normalized workspaces, like
 * ```
 * [
 *  {workspace: {…}, name: 'default', basePath: '/studio/deep/shared/test'},
 *  {workspace: {…}, name: 'playground', basePath: '/studio/deep/shared/playground'}
 *  {workspace: {…}, name: 'staging', basePath: '/studio/deep/shared/staging'}
 * ]
 * ```
 * Becomes a Regex like `/^(\/studio(\/deep(\/shared(\/|$))?(\/|$))?(\/|$))?$/i`
 * @internal
 */
export function createCommonBasePathRegex(workspaces: NormalizedWorkspace[]): RegExp {
  const workspaceSegments = workspaces.map((workspace) =>
    // gets the segments from the basePath
    workspace.basePath
      // removes the leading `/`
      .substring(1)
      .split('/'),
  )

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
  function createCommonBasePathRegexRecursively([first, ...rest]: string[]): string {
    if (!first) return ''
    return `(\\/${escapeRegExp(first)}${createCommonBasePathRegexRecursively(rest)}(\\/|$))?`
  }

  return new RegExp(`^${createCommonBasePathRegexRecursively(commonBasePath)}$`, 'i')
}
