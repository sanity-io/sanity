import {isPlainObject} from 'lodash-es'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}
