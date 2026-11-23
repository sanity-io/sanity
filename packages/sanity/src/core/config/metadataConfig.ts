import {
  type FieldDefinition,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type SchemaValidationValue,
} from '@sanity/types'

import {getPrintableType} from '../util/getPrintableType'
import {isRecord} from '../util/isRecord'
import {flattenConfig} from './flattenConfig'
import {type PluginOptions} from './types'

/**
 * The config options that add to a metadata object type, by the path they are configured at.
 *
 * @internal
 */
export type MetadataConfigPath = 'releases.metadata' | 'beta.variants.metadata'

/**
 * The shape of `releases.metadata` and `beta.variants.metadata`.
 *
 * @internal
 */
export interface MetadataConfig {
  fields?: FieldDefinition[]
  fieldsets?: FieldsetDefinition[]
  groups?: FieldGroupDefinition[]
  validation?: SchemaValidationValue
}

type MetadataKey = 'fields' | 'fieldsets' | 'groups'

const KIND: Record<MetadataKey, string> = {
  fields: 'Field',
  fieldsets: 'Fieldset',
  groups: 'Group',
}

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

/** @internal */
export function warnMetadataConfig(path: MetadataConfigPath, key: MetadataKey, message: string) {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`[${path}.${key}] ${message}`)
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

function expectArray(path: MetadataConfigPath, key: string, value: unknown): unknown[] | undefined {
  if (typeof value === 'undefined') return undefined
  if (!Array.isArray(value)) {
    throw new Error(
      `Expected \`${path}.${key}\` to be an array, but received ${getPrintableType(value)}`,
    )
  }
  return value
}

function acceptFields(path: MetadataConfigPath, entries: unknown[]): FieldDefinition[] {
  return entries.flatMap((entry) => {
    if (isFieldDefinition(entry)) return [entry]
    const {name, reason} = fieldRejection(entry)
    warnMetadataConfig(path, 'fields', `Dropped field "${name}": ${reason}`)
    return []
  })
}

function acceptNamed(path: MetadataConfigPath, key: 'fieldsets' | 'groups', entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (isNamed(entry)) return [entry]
    const kind = KIND[key].toLowerCase()
    warnMetadataConfig(path, key, `Dropped unnamed ${kind}: expected a ${kind} with a name`)
    return []
  })
}

interface MergedEntry<T> {
  entry: T
  source: string
}

/** A later entry replaces an earlier one with the same name, in the earlier one's position. */
function mergeByName<T extends {name: string}>(
  path: MetadataConfigPath,
  key: MetadataKey,
  merged: Map<string, MergedEntry<T>>,
  incoming: T[],
  source: string,
): void {
  for (const entry of incoming) {
    const previous = merged.get(entry.name)
    if (previous) {
      warnMetadataConfig(
        path,
        key,
        previous.source === source
          ? `${KIND[key]} "${entry.name}" is listed more than once in ${source}, so the last one is used`
          : `${KIND[key]} "${entry.name}" from ${source} replaces the one from ${previous.source}`,
      )
    }
    merged.set(entry.name, {entry, source})
  }
}

function mergedEntries<T>(merged: Map<string, MergedEntry<T>>): T[] {
  return [...merged.values()].map(({entry}) => entry)
}

/**
 * Resolves a metadata config option across plugins and the root config. Root config is flattened
 * last, so a later field, fieldset or group with the same name replaces the earlier one, with a
 * warning, and the validation of every config applies. `fields` is always set.
 *
 * Fields named like a core metadata field are kept here: {@link withCoreMetadataFields} drops
 * them when the schema type is built.
 *
 * @internal
 */
export function resolveMetadataConfig(
  config: PluginOptions,
  path: MetadataConfigPath,
  read: (config: PluginOptions) => MetadataConfig | undefined,
): MetadataConfig & {fields: FieldDefinition[]} {
  const fields = new Map<string, MergedEntry<FieldDefinition>>()
  const fieldsets = new Map<string, MergedEntry<FieldsetDefinition>>()
  const groups = new Map<string, MergedEntry<FieldGroupDefinition>>()
  const validations: SchemaValidationValue[] = []

  for (const {config: innerConfig, path: configPath} of flattenConfig(config, [])) {
    const configured = read(innerConfig)
    const metadata: unknown = configured
    if (typeof metadata === 'undefined') continue
    if (!isRecord(metadata)) {
      throw new Error(
        `Expected \`${path}\` to be an object, but received ${getPrintableType(metadata)}`,
      )
    }
    const source = configPath.length > 1 ? `plugin "${innerConfig.name}"` : 'the workspace config'

    const configuredFields = expectArray(path, 'fields', metadata.fields)
    if (configuredFields) {
      mergeByName(path, 'fields', fields, acceptFields(path, configuredFields), source)
    }

    const configuredFieldsets = expectArray(path, 'fieldsets', metadata.fieldsets)
    if (configuredFieldsets) {
      const accepted = acceptNamed(path, 'fieldsets', configuredFieldsets)
      mergeByName(path, 'fieldsets', fieldsets, accepted, source)
    }

    const configuredGroups = expectArray(path, 'groups', metadata.groups)
    if (configuredGroups) {
      mergeByName(path, 'groups', groups, acceptNamed(path, 'groups', configuredGroups), source)
    }

    const validation = configured?.validation
    if (typeof validation !== 'undefined') validations.push(validation)
  }

  return {
    fields: mergedEntries(fields),
    ...(fieldsets.size > 0 ? {fieldsets: mergedEntries(fieldsets)} : {}),
    ...(groups.size > 0 ? {groups: mergedEntries(groups)} : {}),
    ...(validations.length > 0
      ? {validation: validations.length === 1 ? validations[0] : validations}
      : {}),
  }
}

/**
 * The core fields followed by the configured ones. A configured field named like a core field is
 * dropped with a warning, so the core fields can't be overridden.
 *
 * @internal
 */
export function withCoreMetadataFields(
  path: MetadataConfigPath,
  coreFields: FieldDefinition[],
  fields: FieldDefinition[],
): FieldDefinition[] {
  const reserved = new Set(coreFields.map((field) => field.name))
  return [
    ...coreFields,
    ...fields.filter((field) => {
      if (!reserved.has(field.name)) return true
      warnMetadataConfig(
        path,
        'fields',
        `Dropped field "${field.name}": name "${field.name}" is reserved`,
      )
      return false
    }),
  ]
}
