import {ALL_FIELDS_GROUP_NAME} from '@sanity/schema/_internal'
import {
  type FieldGroup,
  type Fieldset,
  isObjectSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Schema,
  type SchemaType,
} from '@sanity/types'

import {warnRejectedReleaseMetadataField} from '../../config/releases/metadataFields'

/** Type name of the object the release metadata form edits. */
export const RELEASE_METADATA_FORM_TYPE_NAME = 'release.metadata'

/** Synthetic form document id. It is not a Content Lake document. */
export const RELEASE_METADATA_FORM_ID = 'release.metadata.form'

const ALLOWED_TYPE_NAMES = new Set([
  'string',
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'url',
])

const BUILTIN_TYPE_NAMES = new Set([
  ...ALLOWED_TYPE_NAMES,
  'object',
  'array',
  'block',
  'span',
  'reference',
  'crossDatasetReference',
  'globalDocumentReference',
  'image',
  'file',
  'email',
  'slug',
  'geopoint',
  'document',
])

function typeChain(type: SchemaType): SchemaType[] {
  const seen = new Set<SchemaType>()
  const chain: SchemaType[] = []
  let current: SchemaType | undefined = type
  while (current && !seen.has(current)) {
    seen.add(current)
    chain.push(current)
    current = current.type
  }
  return chain
}

function componentKeys(type: SchemaType): string[] {
  return typeChain(type).flatMap((entry) => (entry.components ? Object.keys(entry.components) : []))
}

function rejectionReason(type: SchemaType): string | undefined {
  const keys = componentKeys(type)
  if (keys.length > 0) {
    return `components.${keys.join(', components.')} is not supported`
  }

  const names = typeChain(type)
    .map((entry) => entry.name)
    .filter((name) => name.length > 0)
  const disallowed = names.find(
    (name) => BUILTIN_TYPE_NAMES.has(name) && name !== 'object' && !ALLOWED_TYPE_NAMES.has(name),
  )
  if (disallowed) return `type "${disallowed}" is not supported`
  if (type.jsonType === 'array') return 'arrays are not supported'
  if (names.some((name) => ALLOWED_TYPE_NAMES.has(name))) return undefined

  if (type.jsonType === 'object' || names.includes('object')) {
    if (!isObjectSchemaType(type)) return undefined
    for (const field of type.fields) {
      const nested = rejectionReason(field.type)
      if (nested) return `field "${field.name}": ${nested}`
    }
    return undefined
  }

  return `resolved type "${names[0] ?? 'unknown'}" is not supported`
}

/**
 * Drops fields whose resolved type, or `components` override, the release dialog cannot edit.
 * One rejected field does not affect the others.
 */
export function acceptCompiledReleaseMetadataFields(fields: readonly ObjectField[]): ObjectField[] {
  return fields.filter((field) => {
    const reason = rejectionReason(field.type)
    if (reason) warnRejectedReleaseMetadataField(field.name, reason)
    return !reason
  })
}

/**
 * The object type the release metadata form edits: `fields`, with the fieldsets, groups and
 * object-level validation `source` declares for them. Object-level rules only see these fields,
 * since the dialog edits the core fields itself.
 */
export function createReleaseMetadataFormType(
  source: ObjectSchemaType,
  fields: readonly ObjectField[],
  schema: Schema,
): ObjectSchemaType {
  const names = new Set(fields.map((field) => field.name))
  const isKept = (field: ObjectField) => names.has(field.name)

  return {
    name: RELEASE_METADATA_FORM_TYPE_NAME,
    title: source.title,
    jsonType: 'object',
    type: schema.get('object'),
    validation: source.validation,
    fields: [...fields],
    fieldsets: source.fieldsets?.flatMap((fieldset): Fieldset[] => {
      if (fieldset.single) return isKept(fieldset.field) ? [fieldset] : []
      const kept = fieldset.fields.filter(isKept)
      return kept.length > 0 ? [{...fieldset, fields: kept}] : []
    }),
    groups: source.groups?.flatMap((group): FieldGroup[] => {
      if (!group.fields) return [group]
      const kept = group.fields.filter(isKept)
      return kept.length > 0 || group.name === ALL_FIELDS_GROUP_NAME
        ? [{...group, fields: kept}]
        : []
    }),
  }
}
