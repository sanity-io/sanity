/**
 * Check if a perspective is 'raw'
 *
 * @param perspective - the id of the perspective
 * @returns true if the perspective is 'raw'
 *
 * @internal
 */
export function isPerspectiveRaw(perspective: string | undefined): boolean {
  if (!perspective) return false

  return perspective === 'raw'
}
