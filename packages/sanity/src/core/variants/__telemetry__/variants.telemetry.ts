import {defineEvent} from '@sanity/telemetry'

/**
 * The Variants tool page a definition action was taken on: the definitions overview, or a single
 * definition's detail page.
 */
export type VariantsToolLocation = 'variants_overview' | 'variant_detail'

/** Where the create variant dialog was opened from */
export type VariantDefinitionCreatedLocation =
  | Extract<VariantsToolLocation, 'variants_overview'>
  | 'navbar_menu'

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

interface VariantDefinitionCreatedInfo {
  location: VariantDefinitionCreatedLocation
  /** Number of conditions on the new definition */
  conditionCount: number
}

interface VariantDefinitionEditedInfo {
  location: VariantsToolLocation
  titleChanged: boolean
  descriptionChanged: boolean
  conditionsChanged: boolean
  priorityChanged: boolean
}

interface VariantDefinitionDeletedInfo {
  location: VariantsToolLocation
}

interface VariantsToolFilteredInfo {
  /**
   * `variants_overview` filters the definitions by condition, `variant_detail` filters a
   * definition's documents by bundle
   */
  location: VariantsToolLocation
  /** Number of filter values applied after the change, `0` once the filter is cleared */
  activeFilterCount: number
}

interface VariantDefinitionDocumentOpenedInfo {
  /** The bundle of the version the document opens in */
  bundle: 'published' | 'drafts' | 'release'
}

interface VariantVersionCreatedInfo {
  location: VariantVersionCreatedLocation
  /** The bundle the version was created in, `published` for the variant of the published document */
  bundle: 'published' | 'drafts' | 'release'
  /** Whether the version was copied from an existing version, or started from an initial value */
  fromExistingVersion: boolean
}

/** When a variant definition is successfully created */
export const VariantDefinitionCreated = defineEvent<VariantDefinitionCreatedInfo>({
  name: 'Variant Definition Created',
  version: 1,
  description: 'User created a variant definition',
})

/** When a variant definition is successfully saved from the edit dialog */
export const VariantDefinitionEdited = defineEvent<VariantDefinitionEditedInfo>({
  name: 'Variant Definition Edited',
  version: 1,
  description: 'User edited a variant definition, with which parts of it changed',
})

/** When a variant definition is successfully deleted */
export const VariantDefinitionDeleted = defineEvent<VariantDefinitionDeletedInfo>({
  name: 'Variant Definition Deleted',
  version: 1,
  description: 'User deleted a variant definition',
})

/** When a filter in the Variants tool changes */
export const VariantsToolFiltered = defineEvent<VariantsToolFilteredInfo>({
  name: 'Variants Tool Filtered',
  version: 1,
  description: 'User changed a filter in the Variants tool',
})

/** When the detail page of an existing variant definition opens */
export const VariantDefinitionOpened = defineEvent({
  name: 'Variant Definition Opened',
  version: 1,
  description: 'User opened the detail page of a variant definition',
})

/** When a document is opened from the documents table of a variant definition's detail page */
export const VariantDefinitionDocumentOpened = defineEvent<VariantDefinitionDocumentOpenedInfo>({
  name: 'Variant Definition Document Opened',
  version: 1,
  description: 'User opened a document from the detail page of a variant definition',
})

/** When a version of a document is successfully created in a variant */
export const VariantVersionCreated = defineEvent<VariantVersionCreatedInfo>({
  name: 'Variant Version Created',
  version: 1,
  description: 'User created a version of a document in a variant',
})
