import {difference, intersection, isPlainObject, pick} from 'lodash'
import {RouterNode, MatchResult} from './types'
import {arrayify} from './utils/arrayify'

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

function createMatchResult(
  nodes: RouterNode[],
  missing: string[],
  remaining: string[]
): MatchResult {
  return {nodes, missing, remaining}
}

export function findMatchingRoutes(
  node: RouterNode,
  _state?: Record<string, unknown>
): MatchResult {
  if (!_state) {
    return createMatchResult([], [], [])
  }

  const state = node.scope ? _state[node.scope] : _state

  const requiredParams = node.route.segments
    .filter((seg) => seg.type === 'param')
    .map((seg) => seg.name)

  const stateKeys = isRecord(state) ? Object.keys(state) : []

  const consumedParams = intersection(stateKeys, requiredParams)
  const missingParams = difference(requiredParams, consumedParams)
  const remainingParams = difference(stateKeys, consumedParams)

  if (missingParams.length > 0) {
    return createMatchResult([], missingParams, [])
  }

  if (remainingParams.length === 0) {
    return createMatchResult([node], [], [])
  }

  const children = arrayify(
    (typeof node.children === 'function'
      ? node.children(isRecord(state) ? state : {})
      : node.children) || []
  )

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
