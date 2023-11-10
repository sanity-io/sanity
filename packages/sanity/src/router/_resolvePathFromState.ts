import {_findMatchingRoutes} from './_findMatchingRoutes'
import {InternalSearchParam, MatchOk, RouterNode, RouterState} from './types'
import {debug} from './utils/debug'
import {encodeURIComponentExcept} from './encodeURIComponentExcept'

/** @internal */
export function _resolvePathFromState(node: RouterNode, _state: RouterState): string {
  debug('Resolving path from state %o', _state)

  const match = _findMatchingRoutes(node, _state)
  if (match.type === 'error') {
    const unmappable = match.unmappableStateKeys
    if (unmappable.length > 0) {
      throw new Error(
        `Unable to find matching route for state. Could not map the following state key${
          unmappable.length == 1 ? '' : 's'
        } to a valid url: ${unmappable.map(quote).join(', ')}`,
      )
    }
    const missingKeys = match.missingKeys
    throw new Error(
      `Unable to find matching route for state. State object is missing the following key${
        missingKeys.length == 1 ? '' : 's'
      } defined in route: ${missingKeys.map(quote).join(', ')}`,
    )
  }

  const {path, searchParams} = pathFromMatchResult(match)

  const search = searchParams.length > 0 ? encodeParams(searchParams) : ''

  return `/${path.join('/')}${search ? `?${search}` : ''}`
}

function bracketify(value: string): string {
  return `[${value}]`
}

function encodeParams(params: InternalSearchParam[]): string {
  return params
    .map(([key, value]) => {
      return [encodeSearchParamKey(serializeScopedPath(key)), encodeSearchParamValue(value)].join(
        '=',
      )
    })
    .join('&')
}

function serializeScopedPath(scopedPath: string[]): string {
  const [head, ...tail] = scopedPath

  return tail.length > 0 ? [head, ...tail.map(bracketify)].join('') : head
}

function encodeSearchParamValue(value: string): string {
  return encodeURIComponentExcept(value, '/')
}

function encodeSearchParamKey(value: string): string {
  return encodeURIComponent(value)
}

function pathFromMatchResult(match: MatchOk): {
  path: string[]
  searchParams: InternalSearchParam[]
} {
  const matchedState = match.matchedState

  const base = match.node.route.segments.map((segment) => {
    if (segment.type === 'dir') {
      return segment.name
    }

    const transform = match.node.transform && match.node.transform[segment.name]

    return transform
      ? transform.toPath(matchedState[segment.name] as any)
      : matchedState[segment.name]
  })

  const childMatch = match.child ? pathFromMatchResult(match.child) : undefined

  const searchParams = childMatch?.searchParams
    ? [...match.searchParams, ...childMatch.searchParams]
    : match.searchParams

  return {
    searchParams: addNodeScope(match.node, searchParams),
    path: [...(base || []), ...(childMatch?.path || [])],
  }
}

function addNodeScope(
  node: RouterNode,
  searchParams: InternalSearchParam[],
): InternalSearchParam[] {
  const scope = node.scope
  return scope
    ? searchParams.map(([namespaces, value]) => [[scope, ...namespaces], value])
    : searchParams
}

function quote(value: string): string {
  return `"${value}"`
}
