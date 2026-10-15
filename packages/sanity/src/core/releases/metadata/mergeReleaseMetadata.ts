import {type EditableReleaseDocument, type ReleaseType} from '@sanity/client'

import {RESERVED_RELEASE_METADATA_NAMES} from '../../config/releases/metadataFields'

/**
 * Release metadata as Studio holds it while a form is editing configured fields.
 * `@sanity/client` types `metadata` as a closed object. The Content Lake stores
 * extra keys, so this view adds an index signature. The assertion back to the
 * client type lives in {@link asReleaseMetadata}.
 */
export type ReleaseMetadataRecord = {
  [key: string]: unknown
  title?: string
  description?: string
  intendedPublishAt?: string
  releaseType?: ReleaseType
  cardinality?: 'many' | 'one'
}

export function asReleaseMetadata(
  metadata: ReleaseMetadataRecord,
): EditableReleaseDocument['metadata'] {
  return metadata as EditableReleaseDocument['metadata']
}

export function toReleaseMetadataRecord(
  metadata: EditableReleaseDocument['metadata'],
): ReleaseMetadataRecord {
  return metadata
}

/**
 * Copies configured field values onto the metadata already stored on the release.
 * Keys that are not configured fields are left in place. Reserved names are never
 * written from the form value. An absent field value removes that key only.
 */
export function mergeReleaseMetadata(
  metadata: ReleaseMetadataRecord,
  formValue: Record<string, unknown>,
  fieldNames: readonly string[],
): ReleaseMetadataRecord {
  const next: ReleaseMetadataRecord = {...metadata}

  for (const name of fieldNames) {
    if (RESERVED_RELEASE_METADATA_NAMES.has(name)) continue
    if (!Object.prototype.hasOwnProperty.call(formValue, name) || formValue[name] === undefined) {
      delete next[name]
      continue
    }
    next[name] = formValue[name]
  }

  return next
}

export function readFieldValues(
  metadata: ReleaseMetadataRecord,
  fieldNames: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    fieldNames.flatMap((name) => {
      const value = metadata[name]
      return value === undefined ? [] : [[name, value]]
    }),
  )
}
