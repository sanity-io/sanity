import {type SanityDocument} from '@sanity/types'

import {type PatchEvent} from '../form'

/** @internal */
export interface CreateLinkMetadata {
  /** Create document ID */
  _id: string
  /** Create user dataset ID */
  dataset: string
  /** Project user ID who built this document from Create. This is not the Create global user ID, but the Create project user id. */
  userId: string
  /**  If false, document should be put in a limited read-only state. */
  ejected: boolean
  /**  set if Create document originates non-default origin */
  host?: string
}

/** @internal */
export interface CreateLinkedSanityDocument extends SanityDocument {
  _create?: CreateLinkMetadata
}

/** @internal */
export interface CreateLinkedActionsProps {
  metadata: CreateLinkMetadata
  panelPortalElementId: string
  onDocumentChange: (patchEvent: PatchEvent) => void
  documentTitle: string
}

/** @internal */
export interface CreateLinkedDocumentBannerProps {
  metadata: CreateLinkMetadata
}
