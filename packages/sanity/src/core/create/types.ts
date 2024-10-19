import {type SanityDocument} from 'sanity'

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

export interface CreateLinkedActionsProps {
  metadata: CreateLinkMetadata
  panelPortalElementId: string
}

export interface CreateLinkedDocumentBannerProps {
  metadata: CreateLinkMetadata
}
