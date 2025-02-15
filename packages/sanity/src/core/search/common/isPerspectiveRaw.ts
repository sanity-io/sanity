import {isString} from '../../util/isString'

/**
 * Check if a perspective is 'raw'
 *
 * @param perspective - the list with perspective ids or a simple perspective id
 * @returns true if the perspective is 'raw'
 *
 * @internal
 */
export function isPerspectiveRaw(perspective: string[] | string | undefined): boolean {
  if (!perspective) return false

  if (isString(perspective)) {
    return perspective === 'raw'
  }

  return perspective.some((p) => p === 'raw')
}
