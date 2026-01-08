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
  _system?: {
    delete?: boolean
  }
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

/**
 * @internal
 */
export interface StrictVersionLayeringOptions {
  /**
   * By default, version layering includes all document versions, regardless of their expected
   * publication time—or lack thereof. For example, it includes all ASAP and undecided versions,
   * despite ASAP and undecided versions having no fixed chronology. There is no way to determine
   * which ASAP or undecided version is expected to be published before another.
   *
   * It also includes any existing draft, which has no fixed chronology, either.
   *
   * This functionality is useful for listing all document versions in a deterministic order, but
   * doesn't accurately portray the upstream and downstream versions based on expected publication
   * time.
   *
   * In strict mode, version layering instead only includes versions that have a fixed chronology.
   * **Cross-version layering is only effective for scheduled versions, with all other
   * versions being layered directly onto the published version (if it exists).**
   */
  strict?: boolean
}
