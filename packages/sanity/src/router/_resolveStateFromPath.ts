import {RouterNode} from './types'
import {debug} from './utils/debug'
import {arrayify} from './utils/arrayify'

function matchPath(node: RouterNode, path: string): Record<string, string> | null {
  const parts = path.split('/').filter(Boolean)
  const segmentsLength = node.route.segments.length

  if (parts.length < segmentsLength) {
    return null
  }

  const state: Record<string, unknown> = {}
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

  let childState: {
    [key: string]: string
  } | null = null

  const children =
    typeof node.children === 'function' ? arrayify(node.children(state)) : node.children

  children.some((childNode) => {
    // console.log('----childNode')
    // console.log(childNode)
    // console.log('----childNode')

    if (childNode) {
      childState = matchPath(childNode, rest.join('/'))

      return childState
    }

    return undefined
  })

  if (rest.length > 0 && !childState) {
    return null
  }

  const mergedState = {...state, ...(childState || {})}

  return node.scope ? {[node.scope]: mergedState} : mergedState
}

/**
 * @internal
 */
export function _resolveStateFromPath(node: RouterNode, path: string): Record<string, any> | null {
  debug('resolving state from path %s', path)

  const pathMatch = matchPath(node, path.split('?')[0])

  debug('resolved: %o', pathMatch || null)

  return pathMatch || null
}
