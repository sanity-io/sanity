/** @public */
export interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
  [key: string]: unknown
}

/**
 * Similar to `SanityDocument` but only requires the `_id` and `_type`
 *
 * @see SanityDocument
 *
 * @public
 */
export interface SanityDocumentLike {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
  [key: string]: unknown
}

/** @public */
export interface TypedObject {
  [key: string]: unknown
  _type: string
}

/** @public */
export interface KeyedObject {
  [key: string]: unknown
  _key: string
}
