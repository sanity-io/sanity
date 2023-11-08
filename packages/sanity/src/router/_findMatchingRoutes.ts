import {difference, intersection, isPlainObject, pick} from 'lodash'
import {
  InternalSearchParam,
  MatchError,
  MatchOk,
  MatchResult,
  RouterNode,
  RouterState,
} from './types'
import {arrayify} from './utils/arrayify'

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

function createMatchError(
  node: RouterNode,
  missingKeys: string[],
  unmappableStateKeys: string[],
): MatchError {
  return {type: 'error', node, missingKeys, unmappableStateKeys}
}

function createMatchOk(
  node: RouterNode,
  matchedState: Record<string, string>,
  searchParams: InternalSearchParam[],
  child?: MatchOk | undefined,
): MatchOk {
  return {type: 'ok', node, matchedState, searchParams, child}
}

/** @internal */
export function _findMatchingRoutes(node: RouterNode, _state?: RouterState): MatchResult {
  if (!_state) {
    return createMatchOk(node, {}, [])
  }

  const scopedState = node.scope ? (_state[node.scope] as RouterState) : _state

  const {_searchParams: searchParams = [], ...state} = scopedState || {}

  const requiredParams = node.route.segments
    .filter((seg) => seg.type === 'param')
    .map((seg) => seg.name)

  const stateKeys = isRecord(state) ? Object.keys(state) : []

  // These are params found in both the state and the route definition
  const consumedParams = intersection(stateKeys, requiredParams)

  // these are params found in the route definition but not in the state, can't map them to a route
  const missingParams = difference(requiredParams, consumedParams)

  // these are params found in the state but not in the route definition
  const remainingParams = difference(stateKeys, consumedParams)

  if (missingParams.length > 0) {
    return createMatchError(node, missingParams, [])
  }

  const scopedParams = searchParams.map(([key, value]): InternalSearchParam => [[key], value])

  const consumedState = pick(state, consumedParams) as Record<string, string>

  if (remainingParams.length === 0) {
    return createMatchOk(node, consumedState, scopedParams)
  }

  const children = arrayify(
    (typeof node.children === 'function'
      ? node.children(isRecord(state) ? state : {})
      : node.children) || [],
  )

  if (remainingParams.length > 0 && children.length === 0) {
    // our state includes extra keys that's not consumed by child routes
    return createMatchError(node, [], remainingParams)
  }

  const remainingState = pick(state, remainingParams)

  const childResult = children.map((childNode) => _findMatchingRoutes(childNode, remainingState))

  // Look for a matching route
  const found = childResult.find((res): res is MatchOk => res.type === 'ok')
  return found
    ? createMatchOk(node, consumedState, scopedParams, found)
    : createMatchError(node, [], remainingParams)
}
