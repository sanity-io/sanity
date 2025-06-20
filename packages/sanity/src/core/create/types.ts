import {type SanityDocument} from '@sanity/types'

import type {PatchEvent} from '../form/patch/PatchEvent'

/** @internal */
export interface CreateLinkMetadata {
  /** Create document ID */
  _id: string
  /** Create user dataset ID */
  dataset: string
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
  documentTitle?: string
}

/** @internal */
export interface CreateLinkedDocumentBannerContentProps {
  metadata: CreateLinkMetadata
}
