import type {UnitFormatter} from '../../../../hooks'

/**
 * Calculates the size difference between two numbers, in percent
 *
 * @param prev - Previous size
 * @param next - Next size
 * @returns The size difference in percent
 * @internal
 */
export function getSizeDiff(prev: number | undefined, next: number | undefined): number {
  if (!prev || !next) {
    return 0
  }

  const increase = next - prev
  const pct = Math.round((increase / prev) * 100)

  return pct
}

/**
 * Get a "human friendly" representation of a number of bytes, using base10 units
 *
 * @param bytes - Number of bytes
 * @param format - The unit formatter to use (from `useUnitFormatter`)
 * @returns A human friendly representation of the number of bytes
 * @internal
 */
export function getHumanFriendlyBytes(bytes: number, format: UnitFormatter): string {
  if (bytes < 1000) {
    return format(bytes, 'byte')
  }

  if (bytes < 1000 * 1000) {
    return format(bytes / 1000, 'kilobyte')
  }

  if (bytes < 1000 * 1000 * 1000) {
    return format(bytes / (1000 * 1000), 'megabyte')
  }

  if (bytes < 1000 * 1000 * 1000 * 1000) {
    return format(bytes / (1000 * 1000 * 1000), 'gigabyte')
  }

  return format(bytes / (1000 * 1000 * 1000 * 1000), 'terabyte')
}
