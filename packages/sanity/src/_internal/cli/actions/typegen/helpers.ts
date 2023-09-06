import type {
  ConvertedDocumentType,
  ConvertedInterface,
  ConvertedType,
  ConvertedUnion,
} from './types'

export function isUnion(
  type: ConvertedType | ConvertedUnion | ConvertedInterface,
): type is ConvertedUnion {
  return type.kind === 'Union'
}

export function isNonUnion(
  type: ConvertedType | ConvertedUnion | ConvertedInterface,
): type is ConvertedType {
  return !isUnion(type) && 'type' in type
}

export function isDocumentType(
  type: ConvertedType | ConvertedUnion | ConvertedInterface,
): type is ConvertedDocumentType {
  return (
    isNonUnion(type) &&
    type.type === 'Object' &&
    Array.isArray(type.interfaces) &&
    type.interfaces.includes('Document')
  )
}
