import {Schema, SchemaType, Rule as IRule} from '@sanity/types'
import RuleClass from './Rule'
import {slugValidator} from './validators/slugValidator'
import {blockValidator} from './validators/blockValidator'

function inferFromSchemaType(
  typeDef: SchemaType,
  schema: Schema,
  visited = new Set<SchemaType>()
): SchemaType {
  if (visited.has(typeDef)) {
    return typeDef
  }

  visited.add(typeDef)

  if (typeDef.validation === false) {
    typeDef.validation = []
    return typeDef
  }

  const isInitialized =
    Array.isArray(typeDef.validation) &&
    typeDef.validation.every((item) => typeof item.validate === 'function')

  if (isInitialized) {
    inferForFields(typeDef, schema, visited)
    inferForMemberTypes(typeDef, schema, visited)
    return typeDef
  }

  const type = typeDef.type
  const typed = RuleClass[typeDef.jsonType]
  let base = typed ? typed(typeDef) : new RuleClass(typeDef)

  if (type && type.name === 'datetime') {
    base = base.type('Date')
  }

  if (type && type.name === 'date') {
    base = base.type('Date')
  }

  if (type && type.name === 'url') {
    base = base.uri()
  }

  if (type && type.name === 'slug') {
    base = base.custom(slugValidator)
  }

  if (type && type.name === 'reference') {
    base = base.reference()
  }

  if (type && type.name === 'email') {
    base = base.email()
  }

  if (type && type.name === 'block') {
    base = base.block(blockValidator)
  }

  // eslint-disable-next-line no-warning-comments
  // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
  if (typeDef.annotations) {
    // eslint-disable-next-line no-warning-comments
    // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
    typeDef.annotations.forEach((annotation) => inferFromSchemaType(annotation))
  }

  // eslint-disable-next-line no-warning-comments
  // @ts-expect-error TODO (eventually): fix options list grabbing
  if (typeDef.options && typeDef.options.list && Array.isArray(typeDef.options.list)) {
    base = base.valid(
      // eslint-disable-next-line no-warning-comments
      // @ts-expect-error TODO (eventually): fix options list grabbing
      typeDef.options.list.map((option) => extractValueFromListOption(option, typeDef))
    )
  }

  typeDef.validation = inferValidation(typeDef, base)
  inferForFields(typeDef, schema, visited)
  inferForMemberTypes(typeDef, schema, visited)

  return typeDef
}

function inferForFields(typeDef: SchemaType, schema: Schema, visited: Set<SchemaType>): void {
  if (typeDef.jsonType !== 'object' || !typeDef.fields) {
    return
  }

  typeDef.fields.forEach((field) => {
    inferFromSchemaType(field.type, schema, visited)
  })
}

function inferForMemberTypes(typeDef: SchemaType, schema: Schema, visited: Set<SchemaType>): void {
  if (typeDef.jsonType === 'array' && typeDef.of) {
    typeDef.of.forEach((candidate) => inferFromSchemaType(candidate, schema, visited))
  }
}

function extractValueFromListOption(option: unknown, typeDef: SchemaType): unknown {
  // If you define a `list` option with object items, where the item has a `value` field,
  // we don't want to treat that as the value but rather the surrounding object
  // This differs from the case where you have a title/value pair setup for a string/number, for instance
  if (typeDef.jsonType === 'object' && hasValueField(typeDef)) {
    return option
  }

  return (option as Record<string, unknown>).value === undefined
    ? option
    : (option as Record<string, unknown>).value
}

function hasValueField(typeDef: SchemaType): boolean {
  if (!('fields' in typeDef) && typeDef.type) {
    return hasValueField(typeDef.type)
  }

  if (!typeDef || !('fields' in typeDef)) {
    return false
  }

  if (!Array.isArray(typeDef.fields)) {
    return false
  }

  if (typeDef.fields.some((field) => field.name === 'value')) {
    return true
  }

  return false
}

function inferValidation(field: SchemaType, baseRule: IRule): IRule[] {
  if (!field.validation) {
    return [baseRule]
  }

  const validation =
    typeof field.validation === 'function' ? field.validation(baseRule) : field.validation
  return Array.isArray(validation) ? validation : [validation]
}

export default inferFromSchemaType
