import {type DocumentDefinition} from 'sanity'

export interface IncomingReferenceCreationParams {
  reference: {
    _type: 'reference'
    _ref: string
    _weak?: boolean
    _strengthenOnPublish?: {
      type: string
    }
  }
  from: {
    fieldName: string
    type: string
  }
  __internal_isIncomingReferenceCreation: true
  [key: string]: unknown
}

/**
 * Helper function to check if the document is being created from an incoming reference.
 * It will be used in the initialValue callback to determine if the document is being created from an incoming reference.
 *
 * example:
 * ```ts
 * defineType({
 *   name: 'book',
 *   type: 'document',
 *   fields: [...],
 *   initialValue: (params) => {
 *     // If the document is being created from an incoming reference, return the reference
 *     // Otherwise, return undefined
 *     return {
 *       author: isIncomingReferenceCreation(params) ? params.reference : undefined,
 *     }
 *   },
 * })
 * ```
 *
 * @beta
 */
export function isIncomingReferenceCreation(
  initialValue: DocumentDefinition['initialValue'],
): initialValue is IncomingReferenceCreationParams {
  return (
    typeof initialValue === 'object' &&
    initialValue !== null &&
    '__internal_isIncomingReferenceCreation' in initialValue
  )
}
