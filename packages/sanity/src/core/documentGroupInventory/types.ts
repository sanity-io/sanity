import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument, type SchemaType} from '@sanity/types'

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
 * The subset of the document perspective list state consumed by the document
 * group inventory.
 *
 * @internal
 */
export interface DocumentGroupInventoryPerspectiveList {
  filteredReleases: {notCurrentReleases: ReleaseDocument[]}
  getReleaseChipState: (releaseId: string) => {selected: boolean; disabled?: boolean}
  handleCopyToDraftsNavigate: () => void
  isDraftSelected: boolean
  isPublishSelected: boolean
}
