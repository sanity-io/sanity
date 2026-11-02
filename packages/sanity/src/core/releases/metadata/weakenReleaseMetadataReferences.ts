import {isObjectSchemaType, isReferenceSchemaType, type SchemaType} from '@sanity/types'

import {isRecord} from '../../util/isRecord'
import {type ReleaseMetadataRecord} from './mergeReleaseMetadata'

function weakenReference(value: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(value)
  const kept = entries.filter(([key]) => key !== '_strengthenOnPublish')
  const isUnchanged = value._weak === true && kept.length === entries.length
  return isUnchanged ? value : {...Object.fromEntries(kept), _weak: true}
}

function weakenObject(
  value: Record<string, unknown>,
  type: {fields: readonly {name: string; type: SchemaType}[]},
): Record<string, unknown> {
  const next = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const field = type.fields.find((candidate) => candidate.name === key)
      return [key, field ? weakenValue(entry, field.type) : entry]
    }),
  )
  return Object.entries(value).every(([key, entry]) => next[key] === entry) ? value : next
}

function weakenValue(value: unknown, type: SchemaType): unknown {
  if (isRecord(value) && isReferenceSchemaType(type)) return weakenReference(value)
  if (isRecord(value) && isObjectSchemaType(type)) return weakenObject(value, type)
  return value
}

/**
 * Marks every reference in release metadata weak, whatever wrote it: an input, an
 * `initialValue` or a restored draft.
 */
export function weakenReleaseMetadataReferences(
  metadata: ReleaseMetadataRecord,
  type: SchemaType,
): ReleaseMetadataRecord {
  return weakenValue(metadata, type) as ReleaseMetadataRecord
}
