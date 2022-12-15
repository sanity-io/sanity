import {SanityDocument} from '@sanity/types'
import {isNonNullable} from './isNonNullable'

/** @internal */
// nominal/opaque type hack
export type Opaque<T, K> = T & {__opaqueId__: K}

/** @internal */
export type DraftId = Opaque<string, 'draftId'>

/** @internal */
export type PublishedId = Opaque<string, 'publishedId'>

/** @internal */
export const DRAFTS_FOLDER = 'drafts'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}.`

/**
 * Checks if the document ID `documentId` has the same ID as `equalsDocumentId`,
 * if you discard the draft status of the given IDs. Examples:
 *
 * @example
 * Draft vs published document ID, but representing the same document:
 * ```
 * // Prints "true":
 * console.log(documentIdEquals('drafts.agot', 'agot'));
 * ```
 * @example
 * Different documents:
 * ```
 * // Prints "false":
 * console.log(documentIdEquals('hp-tcos', 'hp-hbp'));
 * ```
 *
 * @public
 */
export function documentIdEquals(documentId: string, equalsDocumentId: string): boolean {
  return getPublishedId(documentId) === getPublishedId(equalsDocumentId)
}

/** @internal */
export function isDraft(document: SanityDocument): boolean {
  return isDraftId(document._id)
}

/** @internal */
export function isDraftId(id: string): id is DraftId {
  return id.startsWith(DRAFTS_PREFIX)
}

/** @internal */
export function getIdPair(id: string): {draftId: DraftId; publishedId: PublishedId} {
  return {
    draftId: getDraftId(id),
    publishedId: getPublishedId(id),
  }
}

/** @internal */
export function isPublishedId(id: string): id is PublishedId {
  return !isDraftId(id)
}

/** @internal */
export function getDraftId(id: string): DraftId {
  return isDraftId(id) ? id : ((DRAFTS_PREFIX + id) as DraftId)
}

/** @internal */
export function getPublishedId(id: string): PublishedId {
  return (isDraftId(id) ? id.slice(DRAFTS_PREFIX.length) : id) as PublishedId
}

/** @internal */
export function createDraftFrom(document: SanityDocument): SanityDocument {
  return {
    ...document,
    _id: getDraftId(document._id),
  }
}

/** @internal */
export function newDraftFrom(document: SanityDocument): SanityDocument {
  return {
    ...document,
    _id: DRAFTS_PREFIX,
  }
}

/** @internal */
export function createPublishedFrom(document: SanityDocument): SanityDocument {
  return {
    ...document,
    _id: getPublishedId(document._id),
  }
}

/**
 * Takes a list of documents and collates draft/published pairs into single entries
 * `{id: <published id>, draft?: <draft document>, published?: <published document>}`
 *
 * Note: because Map is ordered by insertion key the resulting array will be ordered by whichever
 * version appeared first
 *
 * @internal
 */
export interface CollatedHit<T extends {_id: string} = {_id: string}> {
  id: string
  type: string
  draft?: T
  published?: T
}

/** @internal */
export function collate<T extends {_id: string; _type: string}>(documents: T[]): CollatedHit<T>[] {
  const byId = documents.reduce((res, doc) => {
    const publishedId = getPublishedId(doc._id)
    let entry = res.get(publishedId)
    if (!entry) {
      entry = {id: publishedId, type: doc._type, published: undefined, draft: undefined}
      res.set(publishedId, entry)
    }

    entry[publishedId === doc._id ? 'published' : 'draft'] = doc
    return res
  }, new Map())

  return Array.from(byId.values())
}

/** @internal */
// Removes published documents that also has a draft
export function removeDupes(documents: SanityDocument[]): SanityDocument[] {
  return collate(documents)
    .map((entry) => entry.draft || entry.published)
    .filter(isNonNullable)
}
