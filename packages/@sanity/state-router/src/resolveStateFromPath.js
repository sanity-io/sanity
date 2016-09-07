import HttpHash from 'http-hash'

export default function resolveStateFromPath(routeNode, path) {
  const result = {}
  const hash = HttpHash()
  hash.set(routeNode.pattern, routeNode)
  const match = hash.get(path)

  if (!match.handler) {
    return {}
  }

  Object.assign(result, match.params)

  if (match.splat != null) {
    // get matching child routes
    const childRoutes = HttpHash()
    const childRouteNodes = routeNode.children(match.params)
    childRouteNodes.forEach(childRouteNode => {
      const pattern  = (childRouteNode.isScope ? childRouteNode.node : childRouteNode).pattern
      childRoutes.set(pattern, childRouteNode)
    })
    const childMatch = childRoutes.get(match.splat || '/')

    if (childMatch.handler) {
      const childNode = childMatch.handler

      const childState = childNode.isScope
        ? {[childNode.name]: resolveStateFromPath(childNode.node, match.splat)}
        : resolveStateFromPath(childNode, match.splat)

      Object.assign(result, childState)
    }
  }
  return result
}
