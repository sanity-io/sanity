import {type CSSProperties} from 'react'

import {type PerspectiveBundle} from '../../../perspective/types'
import {
  type BundleDocument,
  type DocumentValidationStatus,
} from '../../../releases/tool/detail/useBundleDocuments'

export type {DocumentValidationStatus}

/**
 * Shared max content width for the variant detail surface. The header lane, filter lane, and
 * documents table all center their content at this width so nothing bleeds edge-to-edge on wide
 * screens (which reads as "too wide / hard to scan").
 *
 * @internal
 */
export const DETAIL_CONTENT_MAX_WIDTH = 1024

/** Centers a lane/table's inner content at {@link DETAIL_CONTENT_MAX_WIDTH}. */
export const DETAIL_CONTENT_CENTER_STYLE: CSSProperties = {
  maxWidth: DETAIL_CONTENT_MAX_WIDTH,
  marginInline: 'auto',
  width: '100%',
}

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
 * Extends the shared {@link BundleDocument} with the resolved `version` metadata.
 *
 * @internal
 */
export interface DocumentInVariant extends BundleDocument {
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
  /** Unique table row id / sort key. Equals `groupId` in the (single) flat view. */
  rowKey?: string
}
