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
   * For example: filter all books that are from an specific editorial brand: `editorialBrand == "Random House"`
   * The `_type` filter is applied automatically.
   */
  filterQuery?: string
  /**
   * Callback to link a document to a reference.
   *
   * This function is called when a user wants to link an existing document to the current document.
   * It receives two parameters:
   * - The document that will be linked (the target document)
   * - The reference object with all properties needed to establish the link
   *
   * The developer must implement this function to define where and how the reference
   * should be placed within the document structure. The function should return the
   * modified document with the reference properly added.
   *
   * For example:
   *  - We want to link a book to an author:
   * ```ts
   *  onLinkDocument: (document, reference) => {
   *   return {
   *     ...document,
   *     author: reference,
   *   }
   *  }
   * ```
   *
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
  /**
   * Callback to define the actions that will be shown for the linked document.
   *
   * For example:
   * ```ts
   * actions: ({linkedDocument, client}) => {
   *   return [
   *     {label: 'Unlink document',
   *     icon: TrashIcon,
   *     tone: 'critical',
   *     onClick: async () => {
   *       await client.createOrReplace({...linkedDocument, _id: getDraftId(linkedDocument._id), author: undefined})
   *     }
   *   }
   *  ]
   * }
   * ```
   * @param context - The context of the linked document.
   * @returns The actions that will be shown for the linked document.

   */
  actions?: (context: LinkedDocumentActionsContext) => LinkedDocumentAction[]
  /**
   * Whether to allow creation of new references.
   * default: true
   *
   * If false, it will only be possible to link to existing documents.
   * If true, it will be possible to create new references to any template of the type.
   * If an array is provided, it will only be possible to create new references that match the template id in the array provided.
   *
   * To define how a creation will be handled, you can use the `initialValue` option in the
   * document type that will be linked.
   *
   * For example:
   * I want to create a new book from an author:
   * In the author we will have the <IncomingReferenceInput /> with the creationAllowed set to true.
   *
   * Then in the book type, we will have the `initialValue` option to define the default values for the new book.
   * This initialValue callback will receive the `reference` object that needs to be linked to the book in the params.
   *
   * ```ts
   * // Book type
   * export default {
   *   type: 'document',
   *   name: 'book',
   *   title: 'Book',
   *   fields: [
   *     {
   *       name: 'author',
   *       type: 'reference',
   *       to: [{type: 'author'}],
   *     },
   *   ],
   *   initialValue: (params) => {
   *    return {
   *      author: params?.reference,
   *    }
   *  }
   * ```
   */
  creationAllowed?: boolean | string[]
}
