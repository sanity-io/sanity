import {type SchemaType, type SlugSchemaType} from '@sanity/types'

/**
 * A preview path resolved through reference boundaries into GROQ dereference syntax.
 *
 * @internal
 */
export interface ResolvedReferencePath {
  /** e.g. `"author->name"` */
  groqPath: string
  fieldType: 'string' | 'pt'
}

const getTypeChain = (type: SchemaType | undefined): SchemaType[] =>
  type ? [type, ...getTypeChain(type.type)] : []

const isStringField = (schemaType: SchemaType | undefined): boolean =>
  schemaType ? schemaType.jsonType === 'string' : false

const isPtField = (type: SchemaType | undefined): boolean =>
  type?.jsonType === 'array'
    ? type.of.some((arrType) => getTypeChain(arrType).some(({name}) => name === 'block'))
    : false

const isSlugField = (schemaType: SchemaType | undefined): schemaType is SlugSchemaType =>
  getTypeChain(schemaType).some(({jsonType, name}) => jsonType === 'object' && name === 'slug')

/**
 * Walks a field's type chain to find the base `reference` type, handling named aliases
 * (e.g. a custom type with `type: 'reference'` whose own name differs from `'reference'`).
 */
function findReferenceType(fieldType: SchemaType): (SchemaType & {to: SchemaType[]}) | undefined {
  return getTypeChain(fieldType).find(
    (type): type is SchemaType & {to: SchemaType[]} => type.name === 'reference' && 'to' in type,
  )
}

function findFieldInType(schemaType: SchemaType, fieldName: string): SchemaType | undefined {
  if (!('fields' in schemaType) || !schemaType.fields) return undefined
  const field = schemaType.fields.find((schemaField) => schemaField.name === fieldName)
  return field?.type
}

/**
 * Converts a `preview.select` dot-path that crosses reference boundaries into GROQ
 * dereference syntax.
 *
 * `'author.name'` (where `author` is a reference) becomes `'author->name'`.
 *
 * Returns `null` if the path contains no references, cannot be resolved, or the leaf
 * field is not searchable (string, portable text, or slug).
 *
 * @internal
 */
export function resolvePreviewReferencePath(
  schemaType: SchemaType,
  dotPath: string,
): ResolvedReferencePath | null {
  const segments = dotPath.split('.')
  if (segments.length < 2) return null

  let containsReference = false
  const groqParts: string[] = []
  let currentType: SchemaType = schemaType

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex]

    // Numeric segments indicate array index access; advance through the element type
    if (/^\d+$/.test(segment)) {
      if (currentType.jsonType === 'array' && 'of' in currentType && currentType.of?.length) {
        currentType = currentType.of[0]
      }
      continue
    }

    const fieldType = findFieldInType(currentType, segment)
    if (!fieldType) return null

    const isLastSegment = segmentIndex === segments.length - 1

    if (isLastSegment) {
      const isPortableText = isPtField(fieldType)
      if (isStringField(fieldType) || isPortableText) {
        groqParts.push(segment)
      } else if (isSlugField(fieldType)) {
        groqParts.push(`${segment}.current`)
      } else {
        return null
      }

      if (!containsReference) return null
      return {groqPath: groqParts.join(''), fieldType: isPortableText ? 'pt' : 'string'}
    }

    const referenceType = findReferenceType(fieldType)
    if (referenceType) {
      containsReference = true
      groqParts.push(`${segment}->`)

      const nextSegment = segments[segmentIndex + 1]
      const targetType = referenceType.to.find(
        (refTargetType) => findFieldInType(refTargetType, nextSegment) !== undefined,
      )

      if (!targetType) return null
      currentType = targetType
    } else if (fieldType.jsonType === 'object' && 'fields' in fieldType) {
      groqParts.push(`${segment}.`)
      currentType = fieldType
    } else {
      return null
    }
  }

  return null
}
