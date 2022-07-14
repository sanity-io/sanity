import type {SchemaType} from '@sanity/types'
import type {SchemaValidationResult} from '../../typedefs'
import {error} from '../createValidationResult'

export function validateNonObjectFieldsProp(
  typeDef: SchemaType,
  visitorContext
): SchemaValidationResult[] {
  if (!('fields' in typeDef)) {
    return []
  }

  let type = typeDef
  while (type && !type.jsonType) {
    type = visitorContext.getType(type.type)
  }

  if (type && type.jsonType !== 'object') {
    return [error(`Type has propery "fields", but is not an object/document type.`)]
  }

  return []
}
