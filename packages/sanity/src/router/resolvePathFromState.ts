import {flatten} from 'lodash'
import {findMatchingRoutes} from './findMatchingRoutes'
import {RouterNode, MatchResult} from './types'
import {debug} from './utils/debug'

/**
 * @public
 */
export function resolvePathFromState(node: RouterNode, state: Record<string, unknown>): string {
  debug('Resolving path from state %o', state)

  const match: MatchResult = findMatchingRoutes(node, state)

  if (match.remaining.length > 0) {
    const remaining = match.remaining
    throw new Error(
      `Unable to find matching route for state. Could not map the following state key${
        remaining.length == 1 ? '' : 's'
      } to a valid url: ${remaining.join(', ')}`
    )
  }

  if (match.nodes.length === 0) {
    throw new Error(`Unable to resolve path from given state: ${JSON.stringify(state)}`)
  }

  let scopedState: Record<string, unknown> = state

  const relative = flatten(
    match.nodes.map((matchNode) => {
      if (matchNode.scope && matchNode.scope in scopedState) {
        scopedState = scopedState[matchNode.scope] as Record<string, unknown>
      }

      return matchNode.route.segments.map((segment) => {
        if (segment.type === 'dir') {
          return segment.name
        }

        const transform = matchNode.transform && matchNode.transform[segment.name]

        return transform
          ? transform.toPath(scopedState[segment.name] as any)
          : scopedState[segment.name]
      })
    })
  ).join('/')

  debug('Resolved to /%s', relative)

  return `/${relative}`
}
