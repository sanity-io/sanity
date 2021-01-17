import {error} from '../createValidationResult'

export function validateNonObjectFieldsProp(typeDef, visitorContext) {
  if (!typeDef.fields) {
    return []
  }

  let type = typeDef
  while (!type.jsonType && type) {
    type = visitorContext.getType(type.type)
  }

  if (type && type.jsonType !== 'object') {
    return [error(`Type has propery "fields", but is not an object/document type.`)]
  }

  return []
}
