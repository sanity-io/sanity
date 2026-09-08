import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

/**
 * Props for the (pane-coupled) reference preview link component injected into
 * the document group inventory.
 *
 * @internal
 */
export interface DocumentGroupInventoryReferencePreviewLinkProps {
  onClick?: () => void
  type: SchemaType & {icon?: unknown}
  value: SanityDocument | {_id: string; _type: string}
}

/**
 * Pane-coupled presentational components injected into the document group
 * inventory. Only required when the inventory can mutate the document group.
 *
 * @internal
 */
export interface DocumentGroupInventoryComponents {
  DocTitle: ComponentType<{document: SanityDocumentLike}>
  ReferencePreviewLink: ComponentType<DocumentGroupInventoryReferencePreviewLinkProps>
  VersionsPreviewList: ComponentType<{documentType: string; documentVersions: string[]}>
}

/**
 * The subset of the document perspective list state consumed by the document
 * group inventory.
 *
 * @internal
 */
export interface DocumentGroupInventoryPerspectiveList {
  filteredReleases: {notCurrentReleases: ReleaseDocument[]}
  getReleaseChipState: (releaseId: string) => {selected: boolean; disabled?: boolean}
  clearScheduledDraftPerspective: () => void
  isDraftSelected: boolean
  isPublishSelected: boolean
}
