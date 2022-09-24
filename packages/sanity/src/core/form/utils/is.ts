import {SchemaType} from '@sanity/types'

const PRIMITIVES = ['string', 'number', 'boolean']

export function is(typeName: string, type: SchemaType): boolean {
  return type.name === typeName || Boolean(type.type && is(typeName, type.type))
}

export {is as type}

export function primitive(type: SchemaType) {
  return PRIMITIVES.some((typeName) => is(typeName, type))
}
