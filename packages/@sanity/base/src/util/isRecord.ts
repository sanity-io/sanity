// import {isPlainObject} from 'lodash'

/**
 * @internal
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  // return isPlainObject(value)
}
