import {type SelectableTone} from '@sanity/ui'
import {type SanityClient, type SanityDocument} from 'sanity'

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

export type IncomingReferencesOptions = {
  /**
   * The filter query to apply to the incoming references in addition to the type filter.
   * For example: filter all authors with role designer: `role == "designer"`
   * The `_type` filter is applied automatically.
   */
  filterQuery?: string
  /**
   * Callback to link a document to a reference.
   * It takes the document that will be linked and the reference with all the properties it needs to be linked,
   * then the developer needs to define where that reference will be added in the document and add it to the document that is being returned.
   *
   * For example:
   *  - I want to link an author using the bestFriend field:
   * ```ts
   *  onLinkDocument: (document, reference) => {
   *   return {
   *     ...document,
   *     bestFriend: reference,
   *   }
   *  }
   * ```
   *
   *  - I want to link an author using the friends field:
   * ```ts
   *  onLinkDocument: (document, reference) => {
   *   return {
   *     ...document,
   *     friends: [...document.friends, reference],
   *   }
   *  }
   * ```
   *
   * @param document - The document to link to the reference.
   * @param reference - The reference to link to the document.
   * @returns The document to link to the reference. If false, the document will not be linked to the reference.
   */

  onLinkDocument?: (
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
  actions?: (context: LinkedDocumentActionsContext) => LinkedDocumentAction[]
}
