import type {CrossDatasetReferenceSchemaType} from '../crossDatasetReference'
import type {TitledListValue} from './definition'
import type {
  ArraySchemaType,
  BlockChildrenObjectField,
  BlockListObjectField,
  BlockSchemaType,
  BlockStyleObjectField,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  ReferenceSchemaType,
  SchemaType,
  SpanSchemaType,
  StringSchemaType,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}

/**
 * Returns wether or not the given type is a document type
 * (eg that it was defined as `type: 'document'`)
 *
 * @param type - Schema type to test
 * @returns True if type is a document type, false otherwise
 *
 * @public
 */
export function isDocumentSchemaType(type: unknown): type is ObjectSchemaType {
  if (!isObjectSchemaType(type)) {
    return false
  }

  let current: SchemaType | undefined = type as SchemaType
  while (current) {
    if (current.name === 'document') {
      return true
    }

    current = current.type
  }
  return false
}

/** @internal */
export function isObjectSchemaType(type: unknown): type is ObjectSchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'object'
}

/** @internal */
export function isArraySchemaType(type: unknown): type is ArraySchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'array'
}

/** @internal */
export function isArrayOfBlocksSchemaType(
  type: unknown,
): type is ArraySchemaType<ObjectSchemaType> {
  return isArraySchemaType(type) && type.of.some((memberType) => isBlockSchemaType(memberType))
}

/** @internal */
export function isArrayOfObjectsSchemaType(
  type: unknown,
): type is ArraySchemaType<ObjectSchemaType> {
  return isArraySchemaType(type) && type.of.every((memberType) => isObjectSchemaType(memberType))
}

/** @internal */
export function isArrayOfPrimitivesSchemaType(type: unknown): type is ArraySchemaType {
  return isArraySchemaType(type) && type.of.every((memberType) => isPrimitiveSchemaType(memberType))
}

/** @internal */
export function isBooleanSchemaType(type: unknown): type is BooleanSchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'boolean'
}

/** @internal */
export function isStringSchemaType(type: unknown): type is StringSchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'string'
}

/** @internal */
export function isNumberSchemaType(type: unknown): type is NumberSchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'number'
}

/** @internal */
export function isPrimitiveSchemaType(
  type: unknown,
): type is BooleanSchemaType | StringSchemaType | NumberSchemaType {
  return isBooleanSchemaType(type) || isStringSchemaType(type) || isNumberSchemaType(type)
}

/** @internal */
export function isReferenceSchemaType(type: unknown): type is ReferenceSchemaType {
  return isRecord(type) && (type.name === 'reference' || isReferenceSchemaType(type.type))
}

/** @internal */
export function isCrossDatasetReferenceSchemaType(
  type: unknown,
): type is CrossDatasetReferenceSchemaType {
  return (
    isRecord(type) &&
    (type.name === 'crossDatasetReference' || isCrossDatasetReferenceSchemaType(type.type))
  )
}

/** @internal */
export function isTitledListValue(item: unknown): item is TitledListValue {
  return typeof item === 'object' && item !== null && 'title' in item && 'value' in item
}

/** @internal */
export function isSpanSchemaType(type: unknown): type is SpanSchemaType {
  if (!isRecord(type)) return false
  // we check for `annotations` and `decorators` instead of `type.name` because
  // schema names can technically change if someone extends the type
  return Array.isArray(type.annotations) && Array.isArray(type.decorators)
}

/** @internal */
export function isBlockSchemaType(type: unknown): type is BlockSchemaType {
  if (!isRecord(type)) return false
  if (!Array.isArray(type.fields)) return false
  const maybeSpanChildren = type.fields.find(isBlockChildrenObjectField)
  const maybeStyle = type.fields.find(isBlockStyleObjectField)
  const maybeList = type.fields.find(isBlockListObjectField)
  return (
    isBlockChildrenObjectField(maybeSpanChildren) &&
    isBlockStyleObjectField(maybeStyle) &&
    isBlockListObjectField(maybeList)
  )
}

/** @internal */
export function isBlockStyleObjectField(field: unknown): field is BlockStyleObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'style') return false
  return isRecord(field.type) && field.type.jsonType === 'string'
}

/** @internal */
export function isBlockListObjectField(field: unknown): field is BlockListObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'listItem') return false
  return isRecord(field.type) && field.type.jsonType === 'string'
}

/** @internal */
export function isBlockChildrenObjectField(field: unknown): field is BlockChildrenObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'children') return false
  if (!isArraySchemaType(field.type)) return false
  // there will always be a span item in `SpanChildrenObjectField`
  return field.type.of.some(isSpanSchemaType)
}
