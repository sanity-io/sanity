import {resolveJSType} from './resolveJSType'

export function resolveTypeName(value: unknown): string {
  const jsType = resolveJSType(value)
  if (jsType !== 'object') {
    return jsType
  }

  const obj = value as Record<string, unknown> & {_type?: string}
  return ('_type' in obj && obj._type) || jsType
}
