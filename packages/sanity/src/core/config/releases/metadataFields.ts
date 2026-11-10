import {type FieldDefinition} from '@sanity/types'

import {getPrintableType} from '../../util/getPrintableType'
import {isRecord} from '../../util/isRecord'
import {flattenConfig} from '../flattenConfig'
import {type PluginOptions} from '../types'

/**
 * Built-in release metadata keys. A configured field must not write these:
 * the create and edit actions replace the whole metadata object, and these
 * keys already have their own controls.
 *
 * @internal
 */
export const RESERVED_RELEASE_METADATA_NAMES: ReadonlySet<string> = new Set([
  'title',
  'description',
  'releaseType',
  'intendedPublishAt',
  'cardinality',
])

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

function isFieldDefinition(value: unknown): value is FieldDefinition {
  if (!isRecord(value)) return false
  const {name, type} = value
  if (typeof name !== 'string' || typeof type !== 'string') return false
  if (!FIELD_NAME.test(name) || RESERVED_RELEASE_METADATA_NAMES.has(name)) return false
  return true
}

export function warnRejectedReleaseMetadataField(name: string, reason: string): void {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`[releases.metadata.fields] Dropped field "${name}": ${reason}`)
}

function rejectionForDefinition(value: unknown): {name: string; reason: string} | undefined {
  if (isFieldDefinition(value)) return undefined
  if (!isRecord(value) || typeof value.name !== 'string') {
    return {name: 'unnamed field', reason: 'expected a field definition with a name and type'}
  }
  if (!FIELD_NAME.test(value.name)) {
    return {name: value.name, reason: `name "${value.name}" is not a valid field name`}
  }
  if (RESERVED_RELEASE_METADATA_NAMES.has(value.name)) {
    return {name: value.name, reason: `name "${value.name}" is reserved`}
  }
  return {name: value.name, reason: 'expected a type'}
}

function mergeFields(current: FieldDefinition[], incoming: unknown[]): FieldDefinition[] {
  const byName = new Map(current.map((field) => [field.name, field]))
  const order = current.map((field) => field.name)

  for (const entry of incoming) {
    const rejection = rejectionForDefinition(entry)
    if (rejection) {
      warnRejectedReleaseMetadataField(rejection.name, rejection.reason)
      continue
    }
    if (!isFieldDefinition(entry)) continue
    if (!byName.has(entry.name)) order.push(entry.name)
    byName.set(entry.name, entry)
  }

  return order.flatMap((name) => {
    const field = byName.get(name)
    return field ? [field] : []
  })
}

/**
 * Resolves `releases.metadata.fields` across plugins and the root config.
 * Root config is flattened last, so a later field with the same name replaces
 * the earlier one. Unlike `releases.actions`, this runs even when the root
 * config object has no `releases` key.
 *
 * @internal
 */
export function resolveReleaseMetadataFields(config: PluginOptions): FieldDefinition[] {
  const flattened = flattenConfig(config, [])

  return flattened.reduce((fields, {config: innerConfig}) => {
    const configured = innerConfig.releases?.metadata?.fields
    if (typeof configured === 'undefined') return fields
    if (!Array.isArray(configured)) {
      throw new Error(
        `Expected \`releases.metadata.fields\` to be an array, but received ${getPrintableType(configured)}`,
      )
    }
    return mergeFields(fields, configured)
  }, [] as FieldDefinition[])
}
