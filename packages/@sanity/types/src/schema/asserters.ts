import type {CrossDatasetReferenceSchemaType} from '../crossDatasetReference'
import type {
  BlockSchemaType,
  ArraySchemaType,
  ObjectSchemaType,
  ReferenceSchemaType,
  SpanSchemaType,
  TitledListValue,
  SpanChildrenObjectField,
  StyleObjectField,
  ListObjectField,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}

export function isObjectSchemaType(type: unknown): type is ObjectSchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'object'
}

export function isArraySchemaType(type: unknown): type is ArraySchemaType {
  if (!isRecord(type)) return false
  return type.jsonType === 'array'
}

export function isReferenceSchemaType(type: unknown): type is ReferenceSchemaType {
  return isRecord(type) && (type.name === 'reference' || isReferenceSchemaType(type.type))
}

export function isCrossDatasetReferenceSchemaType(
  type: unknown
): type is CrossDatasetReferenceSchemaType {
  return (
    isRecord(type) &&
    (type.name === 'crossDatasetReference' || isCrossDatasetReferenceSchemaType(type.type))
  )
}

export function isTitledListValue(item: unknown): item is TitledListValue {
  return typeof item === 'object' && item !== null && 'title' in item && 'value' in item
}

export function isSpanSchemaType(type: unknown): type is SpanSchemaType {
  if (!isRecord(type)) return false
  // we check for `annotations` and `decorators` instead of `type.name` because
  // schema names can technically change if someone extends the type
  return Array.isArray(type.annotations) && Array.isArray(type.decorators)
}

export function isBlockSchemaType(type: unknown): type is BlockSchemaType {
  if (!isRecord(type)) return false
  if (!Array.isArray(type.fields)) return false

  const [maybeSpanChildren, maybeStyle, maybeList] = type.fields
  return (
    isSpanChildrenObjectField(maybeSpanChildren) &&
    isStyleObjectField(maybeStyle) &&
    isListObjectField(maybeList)
  )
}

export function isStyleObjectField(field: unknown): field is StyleObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'style') return false
  return isRecord(field.type) && field.type.jsonType === 'string'
}

export function isListObjectField(field: unknown): field is ListObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'list') return false
  return isRecord(field.type) && field.type.jsonType === 'string'
}

export function isSpanChildrenObjectField(field: unknown): field is SpanChildrenObjectField {
  if (!isRecord(field)) return false
  if (field.name !== 'children') return false
  if (!isArraySchemaType(field.type)) return false
  // there will always be a span item in `SpanChildrenObjectField`
  return field.type.of.some(isSpanSchemaType)
}
