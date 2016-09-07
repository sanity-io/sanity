export default function createScope(name, routeNode) {
  return {isScope: true, name, node: routeNode}
}