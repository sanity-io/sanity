import {
  type CrossDatasetReferenceSchemaType,
  type GlobalDocumentReferenceSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type SchemaType,
} from '@sanity/types'

const DEFAULT_IMAGE_FIELDS = ['asset', 'hotspot', 'crop', 'media']
const DEFAULT_FILE_FIELDS = ['asset', 'media']
const DEFAULT_GEOPOINT_FIELDS = ['lat', 'lng', 'alt']
const DEFAULT_SLUG_FIELDS = ['current', 'source']

type InternalOwnProps = {fields?: unknown[]; type?: string; name?: string}

export function getCustomFields(type: ObjectSchemaType): (ObjectField & {fieldset?: string})[] {
  const fields = type.fieldsets
    ? type.fieldsets.flatMap((fs) => {
        if (fs.single) {
          return fs.field
        }
        return fs.fields.map((field) => ({
          ...field,
          fieldset: fs.name,
        }))
      })
    : type.fields

  if (isType(type, 'block')) {
    return []
  }
  if (isType(type, 'slug')) {
    return fields.filter((f) => !DEFAULT_SLUG_FIELDS.includes(f.name))
  }
  if (isType(type, 'geopoint')) {
    return fields.filter((f) => !DEFAULT_GEOPOINT_FIELDS.includes(f.name))
  }
  if (isType(type, 'image')) {
    return fields.filter((f) => !DEFAULT_IMAGE_FIELDS.includes(f.name))
  }
  if (isType(type, 'file')) {
    return fields.filter((f) => !DEFAULT_FILE_FIELDS.includes(f.name))
  }
  return fields
}

export function isReference(type: SchemaType): type is ReferenceSchemaType {
  return isType(type, 'reference')
}

export function isCrossDatasetReference(type: SchemaType): type is CrossDatasetReferenceSchemaType {
  return isType(type, 'crossDatasetReference')
}

export function isGlobalDocumentReference(
  type: SchemaType,
): type is GlobalDocumentReferenceSchemaType {
  return isType(type, 'globalDocumentReference')
}

export function isObjectField(maybeOjectField: unknown): boolean {
  return (
    typeof maybeOjectField === 'object' && maybeOjectField !== null && 'name' in maybeOjectField
  )
}

export function isCustomized(maybeCustomized: SchemaType): boolean {
  const internalOwnProps = getSchemaTypeInternalOwnProps(maybeCustomized)

  const hasFieldsArray =
    isObjectField(maybeCustomized) &&
    !isReference(maybeCustomized) &&
    !isCrossDatasetReference(maybeCustomized) &&
    !isGlobalDocumentReference(maybeCustomized) &&
    'fields' in maybeCustomized &&
    Array.isArray(maybeCustomized.fields) &&
    // needed to differentiate inline, named array object types from globally defined types
    // we only consider it customized if the _definition_ has fields declared
    // this holds for all customizable object-like types: object, document, image and file
    internalOwnProps?.fields

  if (!hasFieldsArray) {
    return false
  }

  const fields = getCustomFields(maybeCustomized)
  return !!fields.length
}

export function isType(schemaType: SchemaType, typeName: string): boolean {
  if (schemaType.name === typeName) {
    return true
  }
  if (!schemaType.type) {
    return false
  }
  return isType(schemaType.type, typeName)
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

export function isPrimitive(value: unknown): value is string | boolean | number {
  return isString(value) || isBoolean(value) || isNumber(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'boolean'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'number'
}

/**
 * _internal_ownProps contains the _definition_ for the type.
 * Without it we cannot differentiate inline array item types from globally defined types in array.of
 */
export function getSchemaTypeInternalOwnProps(type: SchemaType): InternalOwnProps | undefined {
  return (type as {_internal_ownProps?: InternalOwnProps})?._internal_ownProps
}

/**
 * This allows us to differentiate inline array.of type definitions vs global type names on compiled schema types
 */
export function getDefinedTypeName(type: SchemaType): string | undefined {
  return getSchemaTypeInternalOwnProps(type)?.type
}
