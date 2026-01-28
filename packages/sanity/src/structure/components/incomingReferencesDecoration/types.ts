import {type SelectableTone} from '@sanity/ui'
import {
  type ActionComponent,
  type DocumentActionDialogProps,
  type PreviewConfig,
  type SanityClient,
  type SanityDocument,
} from 'sanity'

export type IncomingReferenceActionsContext = {
  /**
   * The document that is linked to the reference.
   */
  document: SanityDocument
  getClient: (options: {apiVersion: string}) => SanityClient
}

export type IncomingReferenceActionDescription = {
  label: string
  icon?: React.ElementType
  tone?: SelectableTone
  disabled?: boolean
  onHandle: (() => Promise<void>) | (() => void)
  dialog?: DocumentActionDialogProps | false | null
}

/**
 * Incoming reference action component definition.
 * Allows users to define actions that will be shown in the IncomingReferences component as part
 * of each reference
 * example:
 * ```ts
 * export const LogReferenceAction: IncomingReferenceAction = ({document, getClient}) => {
 *   return {
 *     label: 'Log reference',
 *     icon: LogIcon,
 *     onHandle: () => console.log(document._id)
 *   }
 * }
 * ```
 *
 * @beta
 */
export type IncomingReferenceAction = ActionComponent<
  IncomingReferenceActionsContext,
  IncomingReferenceActionDescription
>

export interface CrossDatasetIncomingReference {
  type: string
  title?: string
  dataset: string
  preview: PreviewConfig
  studioUrl?: (document: {id: string; type?: string}) => string | null
}

export interface IncomingReferenceType {
  type: string
  dataset?: never
  title?: string
}

export function isIncomingReferenceType(
  type: IncomingReferenceType | CrossDatasetIncomingReference,
): type is IncomingReferenceType {
  return !type.dataset
}

export function isCrossDatasetIncomingReference(
  type: IncomingReferenceType | CrossDatasetIncomingReference,
): type is CrossDatasetIncomingReference {
  return Boolean(type.dataset)
}

export type IncomingReferencesFilterResolver = (context: {
  document: SanityDocument | undefined
  getClient: (options: {apiVersion: string}) => SanityClient
}) =>
  | string
  | {filter: string; filterParams?: Record<string, string>}
  | Promise<{filter: string; filterParams?: Record<string, string>}>

export type IncomingReferencesOptions = {
  name: string
  title?: string
  description?: string
  /**
   * The type of the incoming references.
   */
  types: (IncomingReferenceType | CrossDatasetIncomingReference)[]

  /**
   * The filter query to apply to the incoming references in addition to the type filter.
   * For example: filter all books that are from an specific editorial brand: `editorialBrand == "Random House"`
   * The `_type` filter is applied automatically.
   */
  filter?: string | IncomingReferencesFilterResolver
  filterParams?: Record<string, string>

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
   * Callback to define the actions that will be shown for the incoming reference document.
   *
   * For example:
   * ```ts
   * actions: ({document, client}) => {
   *   return [
   *     {label: 'Unlink document',
   *     icon: TrashIcon,
   *     tone: 'critical',
   *     onClick: async () => {
   *       await client.createOrReplace({...document, _id: getDraftId(document._id), author: undefined})
   *     }
   *   }
   *  ]
   * }
   * ```
   * @param context - The context of the linked document.
   * @returns The actions that will be shown for the linked document.

   */
  actions?: IncomingReferenceAction[]
  /**
   * Whether to allow creation of new references.
   * default: true
   *
   * If false, it will only be possible to link to existing documents, if the `onLinkDocument` callback is provided.
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
