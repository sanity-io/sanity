export function replaceProperty<P, V extends P[K], K extends keyof P>(
  parent: P,
  prop: K,
  value: V
): V {
  delete parent[prop]
  parent[prop] = value
  return value
}
