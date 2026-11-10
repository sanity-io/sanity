/** Approximate wire size of a JSON value, in UTF-8 bytes */
export function getPayloadBytes(value: unknown): number {
  const json = JSON.stringify(value)
  if (typeof json !== 'string') {
    return 0
  }
  return new TextEncoder().encode(json).byteLength
}

const UNITS = ['B', 'kB', 'MB', 'GB']

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000
    unit++
  }
  const digits = unit === 0 ? 0 : value < 10 ? 2 : value < 100 ? 1 : 0
  return `${value.toFixed(digits)} ${UNITS[unit]}`
}
