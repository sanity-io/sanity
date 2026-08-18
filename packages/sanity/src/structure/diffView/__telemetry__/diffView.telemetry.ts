import {defineEvent} from '@sanity/telemetry'
import {type DocumentVariantType} from 'sanity'

interface DiffViewDocumentSelectionInfo {
  /**
   * The document variants being viewed, in the order that they are displayed.
   */
  documentVariantTypes: DocumentVariantType[]
}

interface DiffViewDocumentSelectionChangedInfo extends DiffViewDocumentSelectionInfo {
  /**
   * The document variants that were being viewed, in the order that they were
   * displayed, before the user changed them.
   */
  previousDocumentVariantTypes: DocumentVariantType[]
}

/**
 * @internal
 */
export const DiffViewEntered = defineEvent<DiffViewDocumentSelectionInfo>({
  name: 'DiffViewEntered',
  version: 1,
  description: 'User entered document comparison view',
})

/**
 * @internal
 */
export const DiffViewExited = defineEvent<DiffViewDocumentSelectionInfo>({
  name: 'DiffViewExited',
  version: 1,
  description: 'User exited document comparison view',
})

/**
 * @internal
 */
export const DiffViewDocumentSelectionChanged = defineEvent<DiffViewDocumentSelectionChangedInfo>({
  name: 'DiffViewDocumentSelectionChanged',
  version: 1,
  description: 'User set one of the documents being compared',
})
