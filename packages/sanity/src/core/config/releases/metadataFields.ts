import {
  type FieldDefinition,
  type FieldGroupDefinition,
  type FieldsetDefinition,
} from '@sanity/types'

import {RESERVED_RELEASE_METADATA_NAMES} from '../../releases/schema/releaseMetadata'
import {getPrintableType} from '../../util/getPrintableType'
import {isRecord} from '../../util/isRecord'
import {flattenConfig} from '../flattenConfig'
import {type PluginOptions, type ReleaseMetadataConfig} from '../types'

type ReleaseMetadataValidation = NonNullable<ReleaseMetadataConfig['validation']>

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

function warnDropped(key: string, kind: string, name: string, reason: string): void {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`[releases.metadata.${key}] Dropped ${kind} "${name}": ${reason}`)
}

export function warnRejectedReleaseMetadataField(name: string, reason: string): void {
  warnDropped('fields', 'field', name, reason)
}

function isFieldDefinition(value: unknown): value is FieldDefinition {
  if (!isRecord(value)) return false
  const {name, type} = value
  if (typeof name !== 'string' || typeof type !== 'string') return false
  if (!FIELD_NAME.test(name) || RESERVED_RELEASE_METADATA_NAMES.has(name)) return false
  return true
}

function rejectionForField(value: unknown): {name: string; reason: string} | undefined {
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

function isNamed(value: unknown): value is FieldsetDefinition & FieldGroupDefinition {
  return isRecord(value) && typeof value.name === 'string'
}

/** A later entry replaces an earlier one with the same name, in the earlier one's position. */
function mergeByName<T extends {name: string}>(current: T[], incoming: T[]): T[] {
  const byName = new Map(current.map((entry) => [entry.name, entry]))
  for (const entry of incoming) byName.set(entry.name, entry)
  return [...byName.values()]
}

function expectArray(key: string, value: unknown): unknown[] | undefined {
  if (typeof value === 'undefined') return undefined
  if (!Array.isArray(value)) {
    throw new Error(
      `Expected \`releases.metadata.${key}\` to be an array, but received ${getPrintableType(value)}`,
    )
  }
  return value
}

function acceptFields(entries: unknown[]): FieldDefinition[] {
  return entries.flatMap((entry) => {
    const rejection = rejectionForField(entry)
    if (rejection) warnDropped('fields', 'field', rejection.name, rejection.reason)
    return isFieldDefinition(entry) ? [entry] : []
  })
}

function acceptNamed(key: string, kind: string, entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (isNamed(entry)) return [entry]
    warnDropped(key, kind, `unnamed ${kind}`, `expected a ${kind} with a name`)
    return []
  })
}

function mergeValidation(
  validations: ReleaseMetadataValidation[],
): ReleaseMetadataValidation | undefined {
  if (validations.length <= 1) return validations[0]
  return (rule, context) =>
    validations.flatMap((validation) => {
      const result = validation(rule, context)
      return Array.isArray(result) ? result : [result]
    })
}

/**
 * Resolves `releases.metadata` across plugins and the root config. Root config is flattened
 * last, so a later field, fieldset or group with the same name replaces the earlier one, and the
 * validation of every config applies. Unlike `releases.actions`, this runs even when the root
 * config object has no `releases` key. `fields` is always set.
 *
 * @internal
 */
export function resolveReleaseMetadataConfig(
  config: PluginOptions,
): ReleaseMetadataConfig & {fields: FieldDefinition[]} {
  let fields: FieldDefinition[] = []
  let fieldsets: FieldsetDefinition[] = []
  let groups: FieldGroupDefinition[] = []
  const validations: ReleaseMetadataValidation[] = []

  for (const {config: innerConfig} of flattenConfig(config, [])) {
    const metadata: unknown = innerConfig.releases?.metadata
    if (typeof metadata === 'undefined') continue
    if (!isRecord(metadata)) {
      throw new Error(
        `Expected \`releases.metadata\` to be an object, but received ${getPrintableType(metadata)}`,
      )
    }

    const configuredFields = expectArray('fields', metadata.fields)
    if (configuredFields) fields = mergeByName(fields, acceptFields(configuredFields))

    const configuredFieldsets = expectArray('fieldsets', metadata.fieldsets)
    if (configuredFieldsets) {
      fieldsets = mergeByName(fieldsets, acceptNamed('fieldsets', 'fieldset', configuredFieldsets))
    }

    const configuredGroups = expectArray('groups', metadata.groups)
    if (configuredGroups) {
      groups = mergeByName(groups, acceptNamed('groups', 'group', configuredGroups))
    }

    const validation = innerConfig.releases?.metadata?.validation
    if (typeof validation === 'undefined') continue
    if (typeof validation !== 'function') {
      throw new Error(
        `Expected \`releases.metadata.validation\` to be a function, but received ${getPrintableType(validation)}`,
      )
    }
    validations.push(validation)
  }

  const validation = mergeValidation(validations)
  return {
    fields,
    ...(fieldsets.length > 0 ? {fieldsets} : {}),
    ...(groups.length > 0 ? {groups} : {}),
    ...(validation ? {validation} : {}),
  }
}
