// @flow

import type {Type} from '../typeDefs'

export function getSpanType(blockArrayType: Type) {
  const spanField = getSpansField(blockArrayType)
  if (spanField) {
    return spanField.type.of.find(type => type.name === 'span')
  }
  return null
}

export function getSpansField(blockArrayType: Type) {
  const blockField = getBlockField(blockArrayType)
  if (blockField) {
    return blockField.fields.find(field => field.name === 'spans')
  }
  return null
}

export function getBlockField(blockArrayType: Type) {
  const of = blockArrayType.of
  if (of) {
    return of.find((ofType: Type) => ofType.type.name === 'block')
  }
  return null
}

export function getBlockObjectTypes(type: Type) {
  if (!type.of) {
    return []
  }
  return type.of.filter(ofType => ofType.name !== 'block')
}

export function getBlockObjectType(type: Type, name: string) {
  return getBlockObjectTypes(type).find(oType => oType.name === name)
}

export default function resolveSchemaType(blockArrayType: Type, nodeType: string): ?Type {
  switch (nodeType) {
    case 'span':
      return getSpanType(blockArrayType)
    default:
      return getBlockObjectType(blockArrayType, nodeType)
  }
}
