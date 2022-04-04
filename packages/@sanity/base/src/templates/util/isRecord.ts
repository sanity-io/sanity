import {isPlainObject} from 'lodash'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}
