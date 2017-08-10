import {resolveJSType} from './resolveJSType'

export function resolveTypeName(value) {
  const jsType = resolveJSType(value)
  return ((jsType === 'object' && '_type' in value) && value._type) || jsType
}
