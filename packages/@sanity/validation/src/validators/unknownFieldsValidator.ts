import {type CustomValidator, type ObjectSchemaType} from '@sanity/types'

/**
 * Given a schema type, returns a custom validator used to warn users of unknown
 * fields found in an object.
 */
export const unknownFieldsValidator =
  (type: ObjectSchemaType): CustomValidator =>
  (value) => {
    if (typeof value !== 'object') return true
    if (!value) return true

    const fieldNames = new Set(type.fields?.map((field) => field.name))

    const unknownFields = Object.keys(value)
      .filter((key) => !key.startsWith('_'))
      .filter((key) => !fieldNames.has(key))

    return unknownFields.map((unknownField) => ({
      message: `Field '${unknownField}' does not exist on type '${type.name}'`,
      path: [unknownField],
    }))
  }
