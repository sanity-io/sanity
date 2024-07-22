import {type SanityDocument, type SanityDocumentLike} from '@sanity/types'

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
export const VERSION_FOLDER = 'versions'
const PATH_SEPARATOR = '.'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}${PATH_SEPARATOR}`
const VERSION_PREFIX = `${VERSION_FOLDER}${PATH_SEPARATOR}`

/**
 *
 * Checks if the document ID `documentId` has the same ID as `equalsDocumentId`,
 * ignoring the draft prefix.
 *
 * @public
 *
 * @param documentId - The document ID to check
 * @param equalsDocumentId - The document ID to check against
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
 * @returns `true` if the document IDs are equal, `false` otherwise
 */
export function documentIdEquals(documentId: string, equalsDocumentId: string): boolean {
  return getPublishedId(documentId) === getPublishedId(equalsDocumentId)
}

/** @internal */
export function isDraft(document: SanityDocumentLike): boolean {
  return isDraftId(document._id)
}

/** @internal */
export function isDraftId(id: string): id is DraftId {
  return id.startsWith(DRAFTS_PREFIX)
}

/** @internal */
export function isVersionId(id: string): boolean {
  return id.startsWith(VERSION_PREFIX)
}

/**
 * TODO: Improve return type based on presence of `version` option.
 *
 * @internal
 */
export function getIdPair(
  id: string,
  {version}: {version?: string} = {},
): {
  draftId: DraftId
  publishedId: PublishedId
  versionId?: string
} {
  return {
    publishedId: getPublishedId(id),
    draftId: getDraftId(id),
    ...(version
      ? {
          versionId: id.startsWith(`${version}.`) ? id : [version, getPublishedId(id)].join('.'),
        }
      : {}),
  }
}

/** @internal */
export function isPublishedId(id: string): id is PublishedId {
  return !isDraftId(id) && !isVersionId(id)
}

/** @internal */
export function getDraftId(id: string): DraftId {
  return isDraftId(id) ? id : ((DRAFTS_PREFIX + id) as DraftId)
}

/**  @internal */
export function getVersionId(id: string, bundle: string): string {
  if (isVersionId(id)) {
    const [_versionPrefix, versionId, ...publishedId] = id.split(PATH_SEPARATOR)
    if (versionId === bundle) return id
    return `${VERSION_PREFIX}${bundle}${PATH_SEPARATOR}${publishedId}`
  }

  const publishedId = getPublishedId(id)

  return `${VERSION_PREFIX}${bundle}${PATH_SEPARATOR}${publishedId}`
}

/**
 *  @internal
 *  Given an id, returns the versionId if it exists.
 *  e.g. `versions.summer-drop.foo` = `summer-drop`
 *  e.g. `drafts.foo` = `undefined`
 *  e.g. `foo` = `undefined`
 */
export function getVersionFromId(id: string): string | undefined {
  if (!isVersionId(id)) return undefined
  const [_versionPrefix, versionId, ..._publishedId] = id.split(PATH_SEPARATOR)

  return versionId
}

/** @internal */
export function getPublishedId(id: string): PublishedId {
  if (isVersionId(id)) {
    // make sure to only remove the versions prefix and the bundle name
    return id.split(PATH_SEPARATOR).slice(2).join(PATH_SEPARATOR) as PublishedId as PublishedId
  }

  if (isDraftId(id)) {
    return id.slice(DRAFTS_PREFIX.length) as PublishedId
  }

  return id as PublishedId
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
  version?: T
}

interface CollateOptions {
  bundlePerspective?: string
}

/** @internal */
export function collate<
  T extends {
    _id: string
    _type: string
    _version?: Record<string, never>
  },
>(documents: T[], {bundlePerspective}: CollateOptions = {}): CollatedHit<T>[] {
  const byId = documents.reduce((res, doc) => {
    const isVersion = Boolean(doc._version)
    const publishedId = getPublishedId(doc._id, isVersion)
    const bundle = isVersion ? doc._id.split('.').at(0) : undefined

    let entry = res.get(publishedId)
    if (!entry) {
      entry = {
        id: publishedId,
        type: doc._type,
        published: undefined,
        draft: undefined,
        version: undefined,
      }
      res.set(publishedId, entry)
    }

    if (bundlePerspective && bundle === bundlePerspective) {
      entry.version = doc
    }

    if (!isVersion) {
      entry[publishedId === doc._id ? 'published' : 'draft'] = doc
    }

    return res
  }, new Map())

  return (
    Array.from(byId.values())
      // Remove entries that have no data, because all the following conditions are true:
      //
      // 1. They have no published version.
      // 2. They have no draft version.
      // 3. They have a version, but not the one that is currently checked out.
      .filter((entry) => entry.published ?? entry.version ?? entry.draft)
  )
}

/** @internal */
// Removes published documents that also has a draft
export function removeDupes(documents: SanityDocumentLike[]): SanityDocumentLike[] {
  return collate(documents)
    .map((entry) => entry.draft || entry.published)
    .filter(isNonNullable)
}
