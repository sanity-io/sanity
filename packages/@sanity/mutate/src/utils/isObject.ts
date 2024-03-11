export function isObject(val: unknown): val is {
  [K in string]: unknown
} {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}
