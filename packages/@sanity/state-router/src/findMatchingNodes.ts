import {Node, MatchResult} from './types'
import {difference, intersection, pick} from 'lodash'
import arrayify from './utils/arrayify'

function createMatchResult(nodes: Node[], missing: string[], remaining: string[]): MatchResult {
  return {nodes, missing, remaining}
}

export default function findMatchingRoutes(node: Node, _state: Object | null): MatchResult {
  if (_state === null || _state === undefined) {
    return createMatchResult([], [], [])
  }

  const state = node.scope ? _state[node.scope] : _state

  const requiredParams = node.route.segments
    .filter((seg) => seg.type === 'param')
    .map((seg) => seg.name)

  const stateKeys = state ? Object.keys(state) : []

  const consumedParams = intersection(stateKeys, requiredParams)
  const missingParams = difference(requiredParams, consumedParams)
  const remainingParams = difference(stateKeys, consumedParams)

  if (missingParams.length > 0) {
    return createMatchResult([], missingParams, [])
  }

  if (remainingParams.length === 0) {
    return createMatchResult([node], [], [])
  }

  const children =
    (typeof node.children === 'function' ? node.children(state) : node.children) || []

  if (remainingParams.length > 0 && children.length === 0) {
    return createMatchResult([], remainingParams, [])
  }

  const remainingState = pick(state, remainingParams)

  let matchingChild: MatchResult = {nodes: [], remaining: [], missing: []}

  arrayify(children).some((childNode) => {
    matchingChild = findMatchingRoutes(childNode, remainingState)
    return matchingChild.nodes.length > 0
  })

  if (matchingChild.nodes.length === 0) {
    return createMatchResult([], missingParams, remainingParams)
  }

  return createMatchResult(
    [node, ...matchingChild.nodes],
    matchingChild.missing,
    matchingChild.remaining
  )
}
