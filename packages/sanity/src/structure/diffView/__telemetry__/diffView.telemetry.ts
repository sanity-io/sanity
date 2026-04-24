import {defineEvent} from '@sanity/telemetry'
import {type DocumentVariantType} from 'sanity'

interface DiffViewDocumentSelectionInfo {
  /** Variants in display order. */
  documentVariantTypes: DocumentVariantType[]
  /** Diff view session id; `null` outside an active diff view session. */
  sessionId: string | null
  /** Schema type of the compared document. */
  documentType: string
}

interface DiffViewDocumentSelectionChangedInfo extends DiffViewDocumentSelectionInfo {
  /** Variants in display order, before the user changed the selection. */
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
