import {type Schema} from '@sanity/types'

import {flattenConfig} from '../../config/flattenConfig'
import {type PluginOptions, type WorkspaceOptions} from '../../config/types'
import {getLegacyThemeDeprecatedFlags} from '../../theme/_legacy/theme'

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
  deprecatedScheduledPublishingShowReleasesBanner: boolean
  deprecatedBetaFormEnhancedObjectDialog: boolean
  deprecatedBetaCreate: boolean
  deprecatedThemeAvatar: boolean
  deprecatedThemeButton: boolean
  deprecatedThemeContainer: boolean
  deprecatedThemeFocusRing: boolean
  deprecatedThemeInput: boolean
  deprecatedThemeLayer: boolean
  deprecatedThemeMedia: boolean
  deprecatedThemeRadius: boolean
  deprecatedThemeShadows: boolean
  deprecatedThemeSpace: boolean
  deprecatedThemeStyles: boolean
  deprecatedLegacyThemeScreenMediumBreak: boolean
  deprecatedLegacyThemeScreenDefaultBreak: boolean
  deprecatedLegacyThemeScreenLargeBreak: boolean
  deprecatedLegacyThemeScreenXlargeBreak: boolean
  deprecatedPresentationPreviewModeCheck: boolean
  deprecatedPresentationPreviewModeDisable: boolean
  deprecatedPresentationUnstableShowUnsafeShareUrl: boolean
  deprecatedArrayOptionsDirection: boolean
  deprecatedArrayOptionsTreeEditing: boolean
  deprecatedCrossDatasetReferenceExperimentalSearch: boolean
}

/**
 * Creates an empty set of deprecated config flags (all false).
 * @internal
 */
export function createEmptyDeprecatedConfigFlags(): DeprecatedConfigFlags {
  return {
    deprecatedWorkspaceLogo: false,
    deprecatedStudioComponentsLogo: false,
    deprecatedScheduledPublishingShowReleasesBanner: false,
    deprecatedBetaFormEnhancedObjectDialog: false,
    deprecatedBetaCreate: false,
    deprecatedThemeAvatar: false,
    deprecatedThemeButton: false,
    deprecatedThemeContainer: false,
    deprecatedThemeFocusRing: false,
    deprecatedThemeInput: false,
    deprecatedThemeLayer: false,
    deprecatedThemeMedia: false,
    deprecatedThemeRadius: false,
    deprecatedThemeShadows: false,
    deprecatedThemeSpace: false,
    deprecatedThemeStyles: false,
    deprecatedLegacyThemeScreenMediumBreak: false,
    deprecatedLegacyThemeScreenDefaultBreak: false,
    deprecatedLegacyThemeScreenLargeBreak: false,
    deprecatedLegacyThemeScreenXlargeBreak: false,
    deprecatedPresentationPreviewModeCheck: false,
    deprecatedPresentationPreviewModeDisable: false,
    deprecatedPresentationUnstableShowUnsafeShareUrl: false,
    deprecatedArrayOptionsDirection: false,
    deprecatedArrayOptionsTreeEditing: false,
    deprecatedCrossDatasetReferenceExperimentalSearch: false,
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

  // Check beta.form.enhancedObjectDialog and beta.create
  const beta = (
    rawWorkspace as {beta?: {form?: {enhancedObjectDialog?: unknown}; create?: unknown}}
  ).beta
  if (beta?.form?.enhancedObjectDialog !== undefined) {
    flags.deprecatedBetaFormEnhancedObjectDialog = true
  }
  if (beta?.create !== undefined) {
    flags.deprecatedBetaCreate = true
  }

  // Check scheduledPublishing.showReleasesBanner
  const scheduledPublishing = rawWorkspace.scheduledPublishing as
    | {showReleasesBanner?: boolean}
    | undefined
  if (scheduledPublishing?.showReleasesBanner !== undefined) {
    flags.deprecatedScheduledPublishingShowReleasesBanner = true
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
 * Detects deprecated theme options set on a theme object.
 * Uses property checks rather than typed access to avoid deprecated type usage.
 *
 * @internal
 */
export function detectDeprecatedThemeOptions(theme: unknown): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

  if (typeof theme !== 'object' || theme === null) {
    return flags
  }

  const themeObj = theme as Record<string, unknown>

  if ('avatar' in themeObj && themeObj.avatar !== undefined) {
    flags.deprecatedThemeAvatar = true
  }
  if ('button' in themeObj && themeObj.button !== undefined) {
    flags.deprecatedThemeButton = true
  }
  if ('container' in themeObj && themeObj.container !== undefined) {
    flags.deprecatedThemeContainer = true
  }
  if ('focusRing' in themeObj && themeObj.focusRing !== undefined) {
    flags.deprecatedThemeFocusRing = true
  }
  if ('input' in themeObj && themeObj.input !== undefined) {
    flags.deprecatedThemeInput = true
  }
  if ('layer' in themeObj && themeObj.layer !== undefined) {
    flags.deprecatedThemeLayer = true
  }
  if ('media' in themeObj && themeObj.media !== undefined) {
    flags.deprecatedThemeMedia = true
  }
  if ('radius' in themeObj && themeObj.radius !== undefined) {
    flags.deprecatedThemeRadius = true
  }
  if ('shadows' in themeObj && themeObj.shadows !== undefined) {
    flags.deprecatedThemeShadows = true
  }
  if ('space' in themeObj && themeObj.space !== undefined) {
    flags.deprecatedThemeSpace = true
  }
  if ('styles' in themeObj && themeObj.styles !== undefined) {
    flags.deprecatedThemeStyles = true
  }

  return flags
}

/**
 * Detects deprecated schema options (array direction/treeEditing, cross-dataset __experimental_search).
 *
 * @internal
 */
export function detectDeprecatedSchemaOptions(schema: Schema): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

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
  field: {type?: {name?: string; options?: unknown; of?: unknown[]; to?: unknown[]}},
  flags: Partial<DeprecatedConfigFlags>,
): void {
  const fieldType = field.type

  // Check array fields for deprecated direction and treeEditing
  if (fieldType?.name === 'array') {
    checkArrayTypeForDeprecatedOptions(fieldType, flags)
  }

  // Check cross-dataset reference fields for __experimental_search
  if (fieldType?.name === 'crossDatasetReference' && fieldType.to) {
    checkCrossDatasetReferenceForDeprecatedOptions(fieldType.to, flags)
  }
}

function checkArrayTypeForDeprecatedOptions(
  arrayType: {options?: unknown; of?: unknown[]},
  flags: Partial<DeprecatedConfigFlags>,
): void {
  const options = arrayType.options as {direction?: unknown; treeEditing?: unknown} | undefined

  if (options?.direction !== undefined) {
    flags.deprecatedArrayOptionsDirection = true
  }
  if (options?.treeEditing !== undefined) {
    flags.deprecatedArrayOptionsTreeEditing = true
  }

  // Also check nested types within the array
  const ofTypes = arrayType.of as
    | Array<{type?: {name?: string; options?: unknown; to?: unknown[]}}>
    | undefined
  if (ofTypes) {
    for (const ofType of ofTypes) {
      if (ofType.type?.name === 'crossDatasetReference' && ofType.type.to) {
        checkCrossDatasetReferenceForDeprecatedOptions(ofType.type.to, flags)
      }
    }
  }
}

function checkCrossDatasetReferenceForDeprecatedOptions(
  toTypes: unknown[],
  flags: Partial<DeprecatedConfigFlags>,
): void {
  for (const toType of toTypes) {
    if (
      typeof toType === 'object' &&
      toType !== null &&
      '__experimental_search' in toType &&
      (toType as {__experimental_search?: unknown}).__experimental_search !== undefined
    ) {
      flags.deprecatedCrossDatasetReferenceExperimentalSearch = true
      return
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
  tools: Array<{name: string; options?: unknown}>,
): Partial<DeprecatedConfigFlags> {
  const flags: Partial<DeprecatedConfigFlags> = {}

  for (const tool of tools) {
    const options = tool.options as {
      previewUrl?: {previewMode?: {check?: unknown; disable?: unknown}}
      unstable_showUnsafeShareUrl?: unknown
    } | null

    if (!options) continue

    // Check for unstable_showUnsafeShareUrl
    if (options.unstable_showUnsafeShareUrl !== undefined) {
      flags.deprecatedPresentationUnstableShowUnsafeShareUrl = true
    }

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

/**
 * Detects deprecated buildLegacyTheme options (--screen-*-break keys).
 * These are tracked at the module level when buildLegacyTheme is called.
 *
 * @internal
 */
export function detectDeprecatedLegacyThemeOptions(): Partial<DeprecatedConfigFlags> {
  const legacyFlags = getLegacyThemeDeprecatedFlags()
  const flags: Partial<DeprecatedConfigFlags> = {}

  if (legacyFlags.screenMediumBreak) {
    flags.deprecatedLegacyThemeScreenMediumBreak = true
  }
  if (legacyFlags.screenDefaultBreak) {
    flags.deprecatedLegacyThemeScreenDefaultBreak = true
  }
  if (legacyFlags.screenLargeBreak) {
    flags.deprecatedLegacyThemeScreenLargeBreak = true
  }
  if (legacyFlags.screenXlargeBreak) {
    flags.deprecatedLegacyThemeScreenXlargeBreak = true
  }

  return flags
}
