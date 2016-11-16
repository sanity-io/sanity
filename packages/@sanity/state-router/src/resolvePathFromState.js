// @flow
import type {Node, MatchResult} from './types'
import findMatchingNodes from './findMatchingNodes'
import {flatten} from 'lodash'
import {debug} from './utils/debug'

export default function resolvePathFromState(node: Node, state: Object): string {
  debug('Resolving path from state %o', state)

  const match: MatchResult = findMatchingNodes(node, state)
  if (match.remaining.length > 0) {
    const formatted = match.remaining.map(key => `${key} (=${JSON.stringify(state[key])})`).join(', ')
    throw new Error(`State key${match.remaining.length == 1 ? '' : 's'} not mapped to url params: ${formatted}`)
  }

  if (match.nodes.length === 0) {
    throw new Error(`Unable to resolve path from given state: ${JSON.stringify(state)}`)
  }

  let scopedState = state
  const relative = flatten(
    match.nodes.map(matchNode => {
      if (matchNode.scope) {
        scopedState = scopedState[matchNode.scope]
      }
      return matchNode.route.segments.map(segment => {
        if (segment.type === 'dir') {
          return segment.name
        }
        const transform = matchNode.transform && matchNode.transform[segment.name]
        return transform ? transform.toPath(scopedState[segment.name]) : scopedState[segment.name]
      })
    })
  ).join('/')

  debug('Resolved to /%s', relative)

  return `/${relative}`
}
