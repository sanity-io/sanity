import {SanityDocument} from '@sanity/types'
import {isNonNullable} from './isNonNullable'

// nominal/opaque type hack
export type Opaque<T, K> = T & {__opaqueId__: K}

export type DraftId = Opaque<string, 'draftId'>
export type PublishedId = Opaque<string, 'publishedId'>

export const DRAFTS_FOLDER = 'drafts'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}.`

export function isDraft(document: SanityDocument): boolean {
  return isDraftId(document._id)
}

export function isDraftId(id: string): id is DraftId {
  return id.startsWith(DRAFTS_PREFIX)
}

export function getIdPair(id: string): {draftId: DraftId; publishedId: PublishedId} {
  return {
    draftId: getDraftId(id),
    publishedId: getPublishedId(id),
  }
}

export function isPublishedId(id: string): id is PublishedId {
  return !isDraftId(id)
}

export function getDraftId(id: string): DraftId {
  return isDraftId(id) ? id : ((DRAFTS_PREFIX + id) as DraftId)
}

export function getPublishedId(id: string): PublishedId {
  return (isDraftId(id) ? id.slice(DRAFTS_PREFIX.length) : id) as PublishedId
}

export function createDraftFrom(document: SanityDocument): SanityDocument {
  return {
    ...document,
    _id: getDraftId(document._id),
  }
}

export function newDraftFrom(document: SanityDocument): SanityDocument {
  return {
    ...document,
    _id: DRAFTS_PREFIX,
  }
}

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
 */
export interface CollatedHit<T extends {_id: string} = {_id: string}> {
  id: string
  type: string
  draft?: T
  published?: T
}

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

// Removes published documents that also has a draft
export function removeDupes(documents: SanityDocument[]): SanityDocument[] {
  return collate(documents)
    .map((entry) => entry.draft || entry.published)
    .filter(isNonNullable)
}
