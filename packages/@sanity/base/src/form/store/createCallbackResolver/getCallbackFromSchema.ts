import {SchemaType, ConditionalPropertyCallbackContext} from '@sanity/types'

const fieldMapsCache = new WeakMap<SchemaType, Record<string, SchemaType>>()

/**
 * Gets a field from a schema type quickly by utilizing a cached record.
 */
function getField(schemaType: SchemaType, fieldName: string): SchemaType {
  const fieldMap = fieldMapsCache.get(schemaType)
  if (fieldMap) {
    const fieldType = fieldMap[fieldName]
    if (!fieldType) {
      throw new Error(
        `Could not find matching field \`${fieldName}\` in schema type \`${schemaType.name}\``
      )
    }

    return fieldType
  }

  if (!('fields' in schemaType)) {
    throw new Error(`Schema type \`${schemaType.name}\` did not have fields`)
  }

  fieldMapsCache.set(
    schemaType,
    schemaType.fields.reduce<Record<string, SchemaType>>((acc, field) => {
      acc[field.name] = field.type
      return acc
    }, {})
  )
  return getField(schemaType, fieldName)
}

interface GetCallbackFromSchemaOptions {
  schemaType: SchemaType
  path: string[]
  conditionalPropertyKey: 'hidden' | 'readOnly'
}

/**
 * Efficiently reaches into the schema to get the callback at a given path.
 */
export function getCallbackFromSchema({
  schemaType,
  path: [first, ...rest],
  conditionalPropertyKey,
}: GetCallbackFromSchemaOptions): (context: ConditionalPropertyCallbackContext) => boolean {
  if (!first) {
    const callback = schemaType[conditionalPropertyKey]
    if (typeof callback !== 'function') {
      throw new Error('Could not get callback from schema type')
    }

    return callback
  }

  return getCallbackFromSchema({
    schemaType: getField(schemaType, first),
    path: rest,
    conditionalPropertyKey,
  })
}
