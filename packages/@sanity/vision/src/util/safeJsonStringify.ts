/** Nesting past this is replaced with `null` before stringify, independent of engine stack size */
export const MAX_SAFE_JSON_DEPTH = 32

function truncateDepth(value: unknown, depth: number): unknown {
  if (value === null || typeof value !== 'object') return value
  if (depth <= 0) return null
  if (Array.isArray(value)) {
    return value.map((item) => truncateDepth(item, depth - 1))
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, truncateDepth(entry, depth - 1)]),
  )
}

/**
 * `JSON.stringify` that survives BigInt, circular structures, and trees deeper than
 * `MAX_SAFE_JSON_DEPTH`. Depth is capped explicitly (not by waiting for a stack overflow), so
 * Node 22/24/26 behave the same. Non-JSON values become `undefined` (the same as native
 * stringify of `undefined`).
 */
export function safeJsonStringify(value: unknown, space?: string | number): string | undefined {
  try {
    return JSON.stringify(truncateDepth(value, MAX_SAFE_JSON_DEPTH), null, space)
  } catch {
    return undefined
  }
}
