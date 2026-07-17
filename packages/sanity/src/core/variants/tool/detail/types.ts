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
 * In the "group by release" (swimlane) view the same row shape is reused for synthetic
 * *release aggregate* header rows — one collapsible header per bundle the documents ride —
 * carrying the aggregate fields below; real document rows leave them undefined.
 *
 * @internal
 */
export interface DocumentInVariantGroup extends DocumentInVariant {
  groupId: string
  versions: VariantDocumentVersion[]
  isReleaseAggregate?: boolean
  releaseLabel?: string
  releaseCount?: number
  isReleaseExpanded?: boolean
  onToggleRelease?: () => void
}
