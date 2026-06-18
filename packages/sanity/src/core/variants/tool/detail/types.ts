import {type SanityDocument} from '@sanity/client'

import {type PerspectiveBundle} from '../../../perspective/types'
import {type ValidationStatus} from '../../../validation'

/**
 * @internal
 */
export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

/**
 * Bundle metadata for a single variant-scoped document version.
 *
 * @internal
 */
export interface VariantDocumentVersion {
  documentId: string
  bundleId: PerspectiveBundle
  releaseRef: string | null
  updatedAt: string
}

/**
 * A single variant-scoped document version returned by {@link useVariantDocuments}.
 *
 * @internal
 */
export interface DocumentInVariant {
  memoKey: string
  document: SanityDocument
  version: VariantDocumentVersion
  validation: DocumentValidationStatus
}

/**
 * A document group row for the variant detail table.
 * Produced by {@link groupVariantDocumentsByGroup} from a flat {@link DocumentInVariant} list.
 *
 * @internal
 */
export interface DocumentInVariantGroup extends DocumentInVariant {
  groupId: string
  versions: VariantDocumentVersion[]
}
