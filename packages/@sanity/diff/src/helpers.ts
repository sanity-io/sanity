export function replaceProperty<T>(parent: object, prop: string, value: T): T {
  delete parent[prop]
  parent[prop] = value
  return value
}
