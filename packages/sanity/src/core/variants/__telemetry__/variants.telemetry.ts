import {defineEvent} from '@sanity/telemetry'

/**
 * The Variants tool page a definition action was taken on: the definitions overview, or a single
 * definition's detail page.
 */
export type VariantsToolLocation = 'variants_overview' | 'variant_detail'

/** The bundle a variant version lives in, `published` for the variant of the published document */
type VariantVersionBundle = 'published' | 'drafts' | 'release'

/** Where the create variant dialog was opened from */
export type VariantDefinitionCreatedLocation =
  | Extract<VariantsToolLocation, 'variants_overview'>
  | 'navbar_menu'

interface VariantDefinitionCreatedInfo {
  location: VariantDefinitionCreatedLocation
  /** Number of conditions on the new definition */
  conditionCount: number
}

/** When a variant definition is successfully created */
export const VariantDefinitionCreated = defineEvent<VariantDefinitionCreatedInfo>({
  name: 'Variant Definition Created',
  version: 1,
  description: 'User created a variant definition',
})

interface VariantDefinitionEditedInfo {
  location: VariantsToolLocation
  titleChanged: boolean
  descriptionChanged: boolean
  conditionsChanged: boolean
  priorityChanged: boolean
}

/** When a variant definition is successfully saved from the edit dialog */
export const VariantDefinitionEdited = defineEvent<VariantDefinitionEditedInfo>({
  name: 'Variant Definition Edited',
  version: 1,
  description: 'User edited a variant definition, with which parts of it changed',
})

interface VariantDefinitionDeletedInfo {
  location: VariantsToolLocation
}

/** When a variant definition is successfully deleted */
export const VariantDefinitionDeleted = defineEvent<VariantDefinitionDeletedInfo>({
  name: 'Variant Definition Deleted',
  version: 1,
  description: 'User deleted a variant definition',
})

interface VariantsToolFilteredInfo {
  /**
   * `variants_overview` filters the definitions by condition, `variant_detail` filters a
   * definition's documents by bundle
   */
  location: VariantsToolLocation
  /** Number of filter values applied after the change, `0` once the filter is cleared */
  activeFilterCount: number
}

/** When a filter in the Variants tool changes */
export const VariantsToolFiltered = defineEvent<VariantsToolFilteredInfo>({
  name: 'Variants Tool Filtered',
  version: 1,
  description: 'User changed a filter in the Variants tool',
})

/** Where a link to a variant definition's detail page was followed from */
export type VariantDetailLinkLocation =
  /** The detail link next to a variant in the navbar variants menu */
  | 'navbar_menu'
  /** A definition's title in the overview */
  | Extract<VariantsToolLocation, 'variants_overview'>
  /** The link to a duplicate definition in the create or edit dialog */
  | 'variant_dialog'

interface VariantDetailLinkClickedInfo {
  location: VariantDetailLinkLocation
}

/** When the user follows a link to the detail page of a variant definition */
export const VariantDetailLinkClicked = defineEvent<VariantDetailLinkClickedInfo>({
  name: 'Variant Detail Link Clicked',
  version: 1,
  description: 'User followed a link to the detail page of a variant definition',
})

/** When the detail page of an existing variant definition opens */
export const VariantDefinitionOpened = defineEvent({
  name: 'Variant Definition Opened',
  version: 1,
  description: 'User opened the detail page of a variant definition',
})

interface VariantDefinitionDocumentOpenedInfo {
  /** The bundle of the version the document opens in */
  bundle: VariantVersionBundle
}

/** When a document is opened from the documents table of a variant definition's detail page */
export const VariantDefinitionDocumentOpened = defineEvent<VariantDefinitionDocumentOpenedInfo>({
  name: 'Variant Definition Document Opened',
  version: 1,
  description: 'User opened a document from the detail page of a variant definition',
})

/**
 * The control a variant version was created from. `document_pane` is any other control in the
 * document pane, such as a custom form component.
 */
export type VariantVersionCreatedLocation =
  | 'document_group_inventory'
  | 'version_context_menu'
  | 'not_in_variant_banner'
  | 'schedule_draft_action'
  | 'document_pane'

interface VariantVersionCreatedInfo {
  location: VariantVersionCreatedLocation
  /** The bundle the version was created in */
  bundle: VariantVersionBundle
  /** Whether the version was copied from an existing version, or started from an initial value */
  fromExistingVersion: boolean
}

/** When a version of a document is successfully created in a variant */
export const VariantVersionCreated = defineEvent<VariantVersionCreatedInfo>({
  name: 'Variant Version Created',
  version: 1,
  description: 'User created a version of a document in a variant',
})

/** @internal */
export interface VariantConditionsLoadedInfo {
  /** `static` is a fixed list in the config, `function` a callback that returns the list */
  source: 'static' | 'function'
  /** Whether the callback returned a promise. Always `false` for a fixed list */
  async: boolean
  outcome: 'ready' | 'error' | 'timeout'
  /** From calling the callback until its list was ready or it failed. `0` for a fixed list */
  durationMs: number
  /** Valid condition keys in the list, and the values they allow. `0` unless `ready` */
  conditionCount: number
  valueCount: number
  /** Whether the callback called the `getClient` it was given */
  usedSanityClient: boolean
}

/** When the conditions of a variant type are loaded from `beta.variants.types` */
export const VariantConditionsLoaded = defineEvent<VariantConditionsLoadedInfo>({
  name: 'Variant Conditions Loaded',
  version: 1,
  description:
    'The Studio loaded the conditions of a variant type from the config, a fixed list or a callback',
})
