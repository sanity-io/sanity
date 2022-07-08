export function isRecord(value: unknown): value is {[key: string]: unknown} {
  return value !== null && typeof value === 'object'
}
