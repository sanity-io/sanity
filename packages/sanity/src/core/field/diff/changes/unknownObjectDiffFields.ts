import {type ObjectSchemaType} from '@sanity/types'

import {type ObjectDiff} from '../../types'

/**
 * Keys we never surface as “unknown schema” JSON diffs — they are internal /
 * system-managed and would only add noise (or churn) to Review changes.
 *
 * @internal
 */
const SKIP_UNKNOWN_JSON_DIFF_FIELD_NAMES = new Set<string>(['_system'])

/**
 * Field names declared on an object schema type (including multi-fieldsets).
 *
 * @internal
 */
export function collectObjectSchemaFieldNames(schemaType: ObjectSchemaType): Set<string> {
  const names = new Set<string>()
  const fieldSets =
    schemaType.fieldsets || schemaType.fields.map((field) => ({single: true, field}))
  for (const fieldSet of fieldSets) {
    if (fieldSet.single) {
      names.add(fieldSet.field.name)
    } else {
      for (const field of fieldSet.fields) {
        names.add(field.name)
      }
    }
  }
  return names
}

/**
 * Keys present in `diff.fields` that are not declared on `schemaType`, have
 * `isChanged`, and pass optional `fieldFilter` (when set, the name must be
 * included). Skips internal keys such as `_system` (see
 * `SKIP_UNKNOWN_JSON_DIFF_FIELD_NAMES`).
 * Sorted lexicographically for stable UI ordering.
 *
 * @internal
 */
export function getSortedUnknownChangedObjectFieldNames(
  schemaType: ObjectSchemaType,
  diff: ObjectDiff,
  fieldFilter?: string[],
): string[] {
  const schemaFieldNames = collectObjectSchemaFieldNames(schemaType)
  const unknown = Object.keys(diff.fields).filter(
    (name) => !schemaFieldNames.has(name) && !SKIP_UNKNOWN_JSON_DIFF_FIELD_NAMES.has(name),
  )
  unknown.sort()
  return unknown.filter((fieldName) => {
    const fieldDiff = diff.fields[fieldName]
    if (!fieldDiff?.isChanged) {
      return false
    }
    if (fieldFilter && !fieldFilter.includes(fieldName)) {
      return false
    }
    return true
  })
}
