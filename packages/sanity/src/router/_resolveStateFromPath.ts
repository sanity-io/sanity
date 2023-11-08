import {partition} from 'lodash'
import {InternalSearchParam, RouterNode, RouterState, SearchParam} from './types'
import {debug} from './utils/debug'
import {arrayify} from './utils/arrayify'
import {parseScopedParams} from './utils/parseScopedParams'

function matchPath(
  node: RouterNode,
  path: string,
  searchParams: InternalSearchParam[],
): RouterState | null {
  const parts = path.split('/').filter(Boolean)
  const segmentsLength = node.route.segments.length

  if (parts.length < segmentsLength) {
    return null
  }

  const state: RouterState = {}
  const isMatching = node.route.segments.every((segment, i) => {
    if (segment.type === 'dir') {
      return segment.name === parts[i]
    }

    const transform = node.transform && node.transform[segment.name]

    state[segment.name] = transform ? transform.toState(parts[i]) : parts[i]

    return true
  })

  if (!isMatching) {
    return null
  }

  const rest = parts.slice(segmentsLength)

  let childState: RouterState | null = null

  const children =
    typeof node.children === 'function' ? arrayify(node.children(state)) : node.children

  const unscopedParams = removeScope(node.scope, searchParams)

  children.some((childNode) => {
    if (childNode) {
      const childParams = childNode.scope
        ? unscopedParams.filter(([namespaces]) => childNode.scope === namespaces[0])
        : unscopedParams

      childState = matchPath(childNode, rest.join('/'), childParams)
      return childState
    }
    return undefined
  })

  if (rest.length > 0 && !childState) {
    return null
  }

  const selfParams = unscopedParams.flatMap(([namespace, value]): SearchParam[] => {
    return namespace.length === 1 ? [[namespace[0], value]] : []
  })

  const mergedState: RouterState = {
    ...state,
    ...(childState || {}),
    ...(selfParams.length > 0 ? {_searchParams: selfParams} : {}),
  }

  return node.scope ? {[node.scope]: mergedState} : mergedState
}

/**
 * @internal
 */
export function _resolveStateFromPath(node: RouterNode, path: string): Record<string, any> | null {
  debug('resolving state from path %s', path)

  const [pathname, search] = path.split('?')
  const urlSearchParams = Array.from(new URLSearchParams(search).entries())

  const pathMatch = matchPath(node, pathname, parseScopedParams(urlSearchParams))

  debug('resolved: %o', pathMatch || null)

  return pathMatch || null
}

function removeScope(
  scope: string | undefined,
  searchParams: InternalSearchParam[],
): InternalSearchParam[] {
  return scope
    ? searchParams.map(([namespaces, value]) => [
        namespaces[0] === scope ? namespaces.slice(1) : namespaces,
        value,
      ])
    : searchParams
}
