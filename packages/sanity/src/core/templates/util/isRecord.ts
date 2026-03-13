import isPlainObject from 'lodash-es/isPlainObject.js'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}
