import {type SanityDocument} from '@sanity/client'

import {type PerspectiveBundle} from '../../../perspective/types'
import {
  type BundleDocument,
  type DocumentValidationStatus,
} from '../../../releases/tool/detail/useBundleDocuments'

export type {DocumentValidationStatus}

/**
 * Bundle metadata for a single variant-scoped document version.
 *
 * @internal
 */
export interface VariantDocumentVersion {
  documentId: string
  /** Undefined when the document belongs to the published bundle. */
  bundleId?: PerspectiveBundle
  releaseRef: string | null
  updatedAt: string
}

/**
 * A single variant-scoped document version returned by {@link useVariantDocuments}.
 *
 * Builds on the shared {@link BundleDocument}, narrowing `document` to a plain document (variants
 * do not surface `publishedDocumentExists`) and adding the resolved `version` metadata.
 *
 * @internal
 */
export interface DocumentInVariant extends Omit<BundleDocument, 'document'> {
  document: SanityDocument
  version: VariantDocumentVersion
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
