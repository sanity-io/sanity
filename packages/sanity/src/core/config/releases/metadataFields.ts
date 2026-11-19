import {
  type FieldDefinition,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type SchemaValidationValue,
} from '@sanity/types'

import {getPrintableType} from '../../util/getPrintableType'
import {isRecord} from '../../util/isRecord'
import {flattenConfig} from '../flattenConfig'
import {type PluginOptions, type ReleaseMetadataConfig} from '../types'

type ReleaseMetadataKey = 'fields' | 'fieldsets' | 'groups'

const KIND: Record<ReleaseMetadataKey, string> = {
  fields: 'Field',
  fieldsets: 'Fieldset',
  groups: 'Group',
}

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

/** @internal */
export function warnReleaseMetadata(key: ReleaseMetadataKey, message: string): void {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`[releases.metadata.${key}] ${message}`)
}

function isFieldDefinition(value: unknown): value is FieldDefinition {
  if (!isRecord(value)) return false
  const {name, type} = value
  return typeof name === 'string' && typeof type === 'string' && FIELD_NAME.test(name)
}

function fieldRejection(value: unknown): {name: string; reason: string} {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return {name: 'unnamed field', reason: 'expected a field definition with a name and type'}
  }
  if (!FIELD_NAME.test(value.name)) {
    return {name: value.name, reason: `name "${value.name}" is not a valid field name`}
  }
  return {name: value.name, reason: 'expected a type'}
}

function isNamed(value: unknown): value is FieldsetDefinition & FieldGroupDefinition {
  return isRecord(value) && typeof value.name === 'string'
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
    if (isFieldDefinition(entry)) return [entry]
    const {name, reason} = fieldRejection(entry)
    warnReleaseMetadata('fields', `Dropped field "${name}": ${reason}`)
    return []
  })
}

function acceptNamed(key: 'fieldsets' | 'groups', entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (isNamed(entry)) return [entry]
    const kind = KIND[key].toLowerCase()
    warnReleaseMetadata(key, `Dropped unnamed ${kind}: expected a ${kind} with a name`)
    return []
  })
}

interface MergedEntry<T> {
  entry: T
  source: string
}

/** A later entry replaces an earlier one with the same name, in the earlier one's position. */
function mergeByName<T extends {name: string}>(
  key: ReleaseMetadataKey,
  merged: Map<string, MergedEntry<T>>,
  incoming: T[],
  source: string,
): void {
  for (const entry of incoming) {
    const previous = merged.get(entry.name)
    if (previous) {
      warnReleaseMetadata(
        key,
        previous.source === source
          ? `${KIND[key]} "${entry.name}" is listed more than once in ${source}, so the last one is used`
          : `${KIND[key]} "${entry.name}" from ${source} replaces the one from ${previous.source}`,
      )
    }
    merged.set(entry.name, {entry, source})
  }
}

function entries<T>(merged: Map<string, MergedEntry<T>>): T[] {
  return [...merged.values()].map(({entry}) => entry)
}

/**
 * Resolves `releases.metadata` across plugins and the root config. Root config is flattened
 * last, so a later field, fieldset or group with the same name replaces the earlier one, with a
 * warning, and the validation of every config applies. Unlike `releases.actions`, this runs even
 * when the root config object has no `releases` key. `fields` is always set.
 *
 * Fields named like a core metadata field are kept here: `releaseMetadataSchema` drops them
 * when it builds the schema type.
 *
 * @internal
 */
export function resolveReleaseMetadataConfig(
  config: PluginOptions,
): ReleaseMetadataConfig & {fields: FieldDefinition[]} {
  const fields = new Map<string, MergedEntry<FieldDefinition>>()
  const fieldsets = new Map<string, MergedEntry<FieldsetDefinition>>()
  const groups = new Map<string, MergedEntry<FieldGroupDefinition>>()
  const validations: SchemaValidationValue[] = []

  for (const {config: innerConfig, path} of flattenConfig(config, [])) {
    const metadata: unknown = innerConfig.releases?.metadata
    if (typeof metadata === 'undefined') continue
    if (!isRecord(metadata)) {
      throw new Error(
        `Expected \`releases.metadata\` to be an object, but received ${getPrintableType(metadata)}`,
      )
    }
    const source = path.length > 1 ? `plugin "${innerConfig.name}"` : 'the workspace config'

    const configuredFields = expectArray('fields', metadata.fields)
    if (configuredFields) mergeByName('fields', fields, acceptFields(configuredFields), source)

    const configuredFieldsets = expectArray('fieldsets', metadata.fieldsets)
    if (configuredFieldsets) {
      mergeByName('fieldsets', fieldsets, acceptNamed('fieldsets', configuredFieldsets), source)
    }

    const configuredGroups = expectArray('groups', metadata.groups)
    if (configuredGroups) {
      mergeByName('groups', groups, acceptNamed('groups', configuredGroups), source)
    }

    const validation = innerConfig.releases?.metadata?.validation
    if (typeof validation !== 'undefined') validations.push(validation)
  }

  return {
    fields: entries(fields),
    ...(fieldsets.size > 0 ? {fieldsets: entries(fieldsets)} : {}),
    ...(groups.size > 0 ? {groups: entries(groups)} : {}),
    ...(validations.length > 0
      ? {validation: validations.length === 1 ? validations[0] : validations}
      : {}),
  }
}
