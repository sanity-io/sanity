import flatten from 'lodash/flatten'
import difference from 'lodash/difference'
import extractParams from './utils/extractParams'

function insertParams(pattern, params, splat) {
  if (!pattern) {
    return []
  }
  return flatten(
    pattern.split('/')
    .filter(Boolean)
    .map(segment => {
      if (segment.startsWith(':')) {
        const paramName = segment.substring(1)
        return params[paramName]
      }
      if (segment === '*') {
        return splat
      }
      return segment
    }))
    .filter(Boolean)
}

function _resolvePath(routeNode, state) {
  if (routeNode.isScope) {
    return _resolvePath(routeNode.node, state[routeNode.name])
  }

  const requiredParams = extractParams(routeNode.pattern)
  const missingParams = difference(requiredParams, Object.keys(state || {}))

  if (missingParams.length > 0) {
    return null
  }

  let childPath = null
  routeNode.children(state).some(childNode => {
    childPath = _resolvePath(childNode, state)
    return !!childPath
  })

  return insertParams(routeNode.pattern, state)
    .concat(childPath || [])
    .join('/')
}

export default function resolvePathFromState(routeNode, state) {
  return `/${_resolvePath(routeNode, state) || ''}`
}
