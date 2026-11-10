import {Schema} from '@sanity/schema'
import {
  type FieldDefinition,
  isObjectSchemaType,
  type ObjectSchemaType,
  type Schema as SchemaType,
  type SchemaType as SanitySchemaType,
} from '@sanity/types'
import {inferFromSchema} from '@sanity/validation/_internal'

import {warnRejectedReleaseMetadataField} from '../../config/releases/metadataFields'
import {isRecord} from '../../util/isRecord'

/** Type name of the private object that hosts configured release metadata fields. */
export const RELEASE_METADATA_TYPE_NAME = 'release.metadata'

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

function typeChain(type: SanitySchemaType): SanitySchemaType[] {
  const seen = new Set<SanitySchemaType>()
  const chain: SanitySchemaType[] = []
  let current: SanitySchemaType | undefined = type
  while (current && !seen.has(current)) {
    seen.add(current)
    chain.push(current)
    current = current.type
  }
  return chain
}

function componentKeys(type: SanitySchemaType): string[] {
  return typeChain(type).flatMap((entry) => (entry.components ? Object.keys(entry.components) : []))
}

function rejectionReason(type: SanitySchemaType): string | undefined {
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

function definitionComponents(field: FieldDefinition): string[] {
  if (!isRecord(field) || !isRecord(field.components)) return []
  return Object.keys(field.components)
}

function inlineObjectFields(field: FieldDefinition): unknown[] | undefined {
  if (!isRecord(field) || field.type !== 'object' || !Array.isArray(field.fields)) return undefined
  return field.fields
}

function withFields(field: FieldDefinition, fields: FieldDefinition[]): FieldDefinition {
  const next: Record<string, unknown> = {...field, type: 'object'}
  next.fields = fields
  if (!isLooseField(next)) return field
  return next
}

function isLooseField(value: unknown): value is FieldDefinition {
  return isRecord(value) && typeof value.name === 'string' && typeof value.type === 'string'
}

function probeResolvedType(
  field: FieldDefinition,
  parent: SchemaType,
  label: string,
): {ok: true; type: SanitySchemaType} | {ok: false; reported: boolean} {
  try {
    const schema = Schema.compile({
      name: 'release.metadata.probe',
      types: [{name: 'probe', type: 'object', fields: [field]}],
      parent,
    })
    const objectType: unknown = schema.get('probe')
    const resolved = isObjectSchemaType(objectType) ? objectType.fields[0]?.type : undefined
    if (!resolved) return {ok: false, reported: false}
    return {ok: true, type: resolved}
  } catch (error) {
    const message = error instanceof Error ? error.message : 'failed to compile'
    warnRejectedReleaseMetadataField(label, message)
    return {ok: false, reported: true}
  }
}

function acceptField(
  field: FieldDefinition,
  parent: SchemaType,
  label: string,
): FieldDefinition | undefined {
  const components = definitionComponents(field)
  if (components.length > 0) {
    warnRejectedReleaseMetadataField(
      label,
      `components.${components.join(', components.')} is not supported`,
    )
    return undefined
  }

  const inlineFields = inlineObjectFields(field)
  const next = inlineFields
    ? withFields(
        field,
        inlineFields.flatMap((entry) => {
          if (!isLooseField(entry)) {
            warnRejectedReleaseMetadataField(
              label,
              'expected nested fields to be field definitions',
            )
            return []
          }
          const nested = acceptField(entry, parent, `${label}.${entry.name}`)
          return nested ? [nested] : []
        }),
      )
    : field

  if (inlineFields && inlineObjectFields(next)?.length === 0) {
    warnRejectedReleaseMetadataField(label, 'object has no supported fields')
    return undefined
  }

  const resolved = probeResolvedType(next, parent, label)
  if (!resolved.ok) {
    if (!resolved.reported) {
      warnRejectedReleaseMetadataField(label, `type "${String(field.type)}" could not be resolved`)
    }
    return undefined
  }

  const reason = rejectionReason(resolved.type)
  if (reason) {
    warnRejectedReleaseMetadataField(label, reason)
    return undefined
  }

  return next
}

/**
 * Drops fields whose resolved type, or `components` override, cannot be edited
 * on release metadata. One rejected field does not affect the others.
 */
export function acceptReleaseMetadataFields(
  fields: readonly FieldDefinition[],
  parent: SchemaType,
): FieldDefinition[] {
  return fields.flatMap((field) => {
    const accepted = acceptField(field, parent, field.name)
    return accepted ? [accepted] : []
  })
}

export function compileReleaseMetadataSchema(
  fields: readonly FieldDefinition[],
  parent: SchemaType,
): {schema: SchemaType; schemaType: ObjectSchemaType} | null {
  const accepted = acceptReleaseMetadataFields(fields, parent)
  if (accepted.length === 0) return null

  try {
    const schema = inferFromSchema(
      Schema.compile({
        name: 'release.metadata',
        types: [
          {
            name: RELEASE_METADATA_TYPE_NAME,
            type: 'object',
            fields: accepted,
          },
        ],
        parent,
      }),
    )
    const schemaType: unknown = schema.get(RELEASE_METADATA_TYPE_NAME)
    if (!isObjectSchemaType(schemaType)) return null
    return {schema, schemaType}
  } catch (error) {
    const message = error instanceof Error ? error.message : 'failed to compile'
    warnRejectedReleaseMetadataField(RELEASE_METADATA_TYPE_NAME, message)
    return null
  }
}
