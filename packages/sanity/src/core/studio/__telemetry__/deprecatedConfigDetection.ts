import {type Schema} from '@sanity/types'

import {flattenConfig} from '../../config/flattenConfig'
import {type PluginOptions, type WorkspaceOptions} from '../../config/types'

/**
 * Flags for deprecated config options that a customer might set.
 * Each flag is `true` when the customer has set that option, `false` otherwise.
 * These are used to track usage before removing the options in v7.
 *
 * @internal
 */
export interface DeprecatedConfigFlags {
  deprecatedWorkspaceLogo: boolean
  deprecatedStudioComponentsLogo: boolean
  deprecatedPresentationPreviewModeCheck: boolean
  deprecatedPresentationPreviewModeDisable: boolean
  deprecatedArrayOptionsDirection: boolean
}

/**
 * Creates an empty set of deprecated config flags (all false).
 * @internal
 */
export function createEmptyDeprecatedConfigFlags(): DeprecatedConfigFlags {
  return {
    deprecatedWorkspaceLogo: false,
    deprecatedStudioComponentsLogo: false,
    deprecatedPresentationPreviewModeCheck: false,
    deprecatedPresentationPreviewModeDisable: false,
    deprecatedArrayOptionsDirection: false,
  }
}

/**
 * Detects deprecated config options from raw workspace config and its plugins.
 *
 * @internal
 */
export function detectDeprecatedRawConfigOptions(
  rawWorkspace: WorkspaceOptions,
): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

  // Check workspace-level logo
  // oxlint-disable-next-line no-deprecated -- detecting usage of deprecated option
  if (rawWorkspace.logo !== undefined) {
    flags.deprecatedWorkspaceLogo = true
  }

  // Walk the plugin chain to check for studio.components.logo
  const flattened = flattenConfig(rawWorkspace, [])
  for (const {config} of flattened) {
    const studioComponents = (config as PluginOptions).studio?.components
    // oxlint-disable-next-line no-deprecated -- detecting usage of deprecated option
    if (studioComponents?.logo !== undefined) {
      flags.deprecatedStudioComponentsLogo = true
      break
    }
  }

  return flags
}

/**
 * Detects deprecated schema options (array direction).
 *
 * @internal
 */
export function detectDeprecatedSchemaOptions(
  schema: Schema | undefined | null,
): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

  if (!schema || typeof schema.getTypeNames !== 'function' || typeof schema.get !== 'function') {
    return flags
  }

  for (const typeName of schema.getTypeNames()) {
    const schemaType = schema.get(typeName)
    if (!schemaType) continue

    // Check document and object types for their fields
    if (schemaType.type?.name === 'document' || schemaType.type?.name === 'object') {
      const objectType = schemaType as {fields?: Array<{type?: {name?: string; options?: unknown}}>}
      for (const field of objectType.fields ?? []) {
        checkFieldForDeprecatedOptions(field, flags)
      }
    }

    // Also check array types directly defined at root
    if (schemaType.type?.name === 'array') {
      checkArrayTypeForDeprecatedOptions(schemaType, flags)
    }
  }

  return flags
}

function checkFieldForDeprecatedOptions(
  field: {
    type?: {name?: string; options?: unknown; of?: unknown[]; fields?: unknown[]}
  },
  flags: Partial<DeprecatedConfigFlags>,
): void {
  const fieldType = field.type

  // Check array fields for deprecated direction
  if (fieldType?.name === 'array') {
    checkArrayTypeForDeprecatedOptions(fieldType, flags)
  }

  // Recursively check nested object fields
  if (fieldType?.name === 'object' && fieldType.fields) {
    const nestedFields = fieldType.fields as Array<{
      type?: {name?: string; options?: unknown; of?: unknown[]; fields?: unknown[]}
    }>
    for (const nestedField of nestedFields) {
      checkFieldForDeprecatedOptions(nestedField, flags)
    }
  }
}

function checkArrayTypeForDeprecatedOptions(
  arrayType: {options?: unknown; of?: unknown[]},
  flags: Partial<DeprecatedConfigFlags>,
): void {
  const options = arrayType.options as {direction?: unknown} | undefined

  if (options?.direction !== undefined) {
    flags.deprecatedArrayOptionsDirection = true
  }

  // Inline members are the compiled type itself, so their payload is on the member, not on `type`
  const ofTypes = arrayType.of as
    | Array<{
        type?: {name?: string}
        fields?: Array<Parameters<typeof checkFieldForDeprecatedOptions>[0]>
      }>
    | undefined
  if (ofTypes) {
    for (const ofType of ofTypes) {
      if (ofType.type?.name === 'object' && ofType.fields) {
        for (const nestedField of ofType.fields) {
          checkFieldForDeprecatedOptions(nestedField, flags)
        }
      }
    }
  }
}

/**
 * Detects deprecated presentation tool options.
 * This checks the tools array for presentation tools and their options.
 *
 * @internal
 */
export function detectDeprecatedPresentationOptions(
  tools: Array<{name: string; options?: unknown}> | undefined,
): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

  if (!tools || !Array.isArray(tools)) {
    return flags
  }

  for (const tool of tools) {
    const options = tool.options as {
      previewUrl?: {previewMode?: {check?: unknown; disable?: unknown}}
    } | null

    if (!options) continue

    // Check for previewMode.check and previewMode.disable
    const previewUrl = options.previewUrl
    if (typeof previewUrl === 'object' && previewUrl !== null) {
      const previewMode = previewUrl.previewMode
      if (typeof previewMode === 'object' && previewMode !== null) {
        if (previewMode.check !== undefined) {
          flags.deprecatedPresentationPreviewModeCheck = true
        }
        if (previewMode.disable !== undefined) {
          flags.deprecatedPresentationPreviewModeDisable = true
        }
      }
    }
  }

  return flags
}
