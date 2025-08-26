import {type SelectableTone} from '@sanity/ui'
import {type SanityClient, type SanityDocument} from 'sanity'

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

type LinkedDocumentActionsContext = {
  /**
   * The document that is linked to the reference.
   */
  linkedDocument: SanityDocument
  client: SanityClient
}

type LinkedDocumentAction = {
  label: string
  icon?: React.ElementType
  tone?: SelectableTone
  disabled?: boolean
  onClick: (() => Promise<void>) | (() => void)
}

export type LinkedDocumentActions = (
  context: LinkedDocumentActionsContext,
) => LinkedDocumentAction[]
