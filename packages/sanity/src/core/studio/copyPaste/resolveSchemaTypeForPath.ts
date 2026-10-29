import {
  type ArraySchemaType,
  isIndexSegment,
  isKeySegment,
  isObjectSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type Schema,
  type SchemaType,
} from '@sanity/types'
import {fromString, toString} from '@sanity/util/paths'

import {getValueAtPath} from '../../field/paths/helpers'
import {getItemType} from '../../form/store/utils/getItemType'
import {type FormDocumentValue} from '../../form/types/formDocumentValue'

function getSchemaField(schemaType: SchemaType, fieldPath: string): ObjectField | undefined {
  if (!fieldPath) return undefined

  const paths = fromString(fieldPath)
  const firstPath = paths[0]

  if (firstPath && isObjectSchemaType(schemaType)) {
    const field = schemaType?.fields?.find((f) => f.name === firstPath)

    if (field) {
      const nextPath = toString(paths.slice(1))

      if (nextPath) {
        return getSchemaField(field.type, nextPath)
      }

      return field
    }
  }

  return undefined
}

/**
 * Returns the name of the nearest type in the parent type chain that resolves back to
 * that same type through `schema.get()` — or the core type at the root of the chain.
 * Inline types carry names that are either not registered or, worse, can collide with an
 * unrelated top-level type of the same name, so their name cannot be recorded on the
 * clipboard and looked up again at paste time.
 */
export function getResolvableTypeName(schema: Schema, schemaType: SchemaType): string {
  let current: SchemaType = schemaType
  while (current.type && schema.get(current.name) !== current) {
    current = current.type
  }
  return current.name
}

export function resolveSchemaTypeForPath(
  baseType: SchemaType,
  path: Path,
  documentValue?: FormDocumentValue | unknown,
): SchemaType | undefined {
  if (!baseType) return undefined

  let currentField: ObjectSchemaType | ArraySchemaType | SchemaType = baseType

  path.forEach((segment, index) => {
    const nextPath = path.slice(0, index + 1)
    const isArrayItem = isKeySegment(segment) || isIndexSegment(segment)

    if (isArrayItem) {
      // We know that the currentField is an array schema type
      // if the current segment is an array item.
      const arraySchemaType = currentField as ArraySchemaType

      // Get the value of the array item at the current path
      const itemValue = getValueAtPath(documentValue, nextPath) as unknown[]

      // Get the schema type of the array item
      const item = getItemType(arraySchemaType, itemValue)

      if (item) {
        currentField = item as ObjectSchemaType

        return
      }
    }

    const nextField = getSchemaField(
      currentField,
      toString(nextPath.length > 1 ? nextPath.slice(-1) : nextPath),
    ) as ObjectSchemaType

    if (nextField?.type) {
      currentField = nextField.type as ObjectSchemaType
    }
  })

  return currentField
}
