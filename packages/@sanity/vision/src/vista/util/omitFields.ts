import {isPlainObject} from '../../util/isPlainObject'

/** Dotted field paths split into their segments; empty paths and segments are dropped */
export function parseFieldPaths(fields: readonly string[]): string[][] {
  return fields
    .map((field) =>
      field
        .split('.')
        .map((segment) => segment.trim())
        .filter(Boolean),
    )
    .filter((segments) => segments.length > 0)
}

function omit(value: unknown, paths: string[][], continuing: string[][]): unknown {
  // Arrays are transparent: `tags.label` reaches the `label` of every item in `tags`
  if (Array.isArray(value)) {
    let changed = false
    const items = value.map((item) => {
      const next = omit(item, paths, continuing)
      if (next !== item) changed = true
      return next
    })
    return changed ? items : value
  }
  if (!isPlainObject(value)) return value

  // A path matches from any object, as well as further down the paths entered above
  const active = continuing.length > 0 ? [...paths, ...continuing] : paths
  let changed = false
  const entries: [string, unknown][] = []
  for (const [key, child] of Object.entries(value)) {
    const matching = active.filter((segments) => segments[0] === key)
    if (matching.some((segments) => segments.length === 1)) {
      changed = true
      continue
    }
    const next = omit(
      child,
      paths,
      matching.map((segments) => segments.slice(1)),
    )
    if (next !== child) changed = true
    entries.push([key, next])
  }
  // `fromEntries` defines properties, so a `__proto__` key stays a key
  return changed ? Object.fromEntries(entries) : value
}

/**
 * The value without the fields at `paths`, matched at any depth: `[['_rev']]` drops every
 * `_rev`, `[['_system', 'base', 'rev']]` that nested field wherever the path fits. Parts that
 * keep all their fields are returned as they are.
 */
export function omitFields(value: unknown, paths: readonly string[][]): unknown {
  return paths.length === 0 ? value : omit(value, [...paths], [])
}
