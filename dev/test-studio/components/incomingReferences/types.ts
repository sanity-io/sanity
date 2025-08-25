import {type SanityDocument} from 'sanity'

export type OnLinkDocumentCallback = (
  document: SanityDocument,
  reference: {
    _type: 'reference'
    _ref: string
    _weak?: boolean
    _strengthenOnPublish?: {
      type: string
    }
  },
) => SanityDocument | false

export type OnUnlinkDocumentCallback = (
  document: SanityDocument,
  referencedId: string,
) => SanityDocument | false
