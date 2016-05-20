import basicTypes from '../types'

const BASIC_TYPE_NAMES = Object.keys(basicTypes)

export function getFieldType(schema, field) {
  const schemaType = schema.types[field.type]
  if (schemaType) {
    return schemaType
  }
  if (!BASIC_TYPE_NAMES.includes(field.type)) {
    // todo: this will normally fail during schema compilation, but keep it here for now and consider remove later
    console.warn('Invalid field type "%s" of field "%s". Must be one of %s', field.type, field.name, BASIC_TYPE_NAMES.join(', '))
  }
  // Treat as "anonymous"/inline type where type parameters are defined in field
  // todo: consider validate that the needed params are defined in field (currently also taken
  // care of during schema compilation)
  return {name: field.type}
}
