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
/** @internal */
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
  if (version === 'drafts' || version === 'published') {
    throw new Error('Version can not be "published" or "drafts"')
  }
  return {
    publishedId: getPublishedId(id),
    draftId: getDraftId(id),
    ...(version
      ? {
          versionId: getVersionId(id, version),
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
  if (isVersionId(id)) {
    const publishedId = getPublishedId(id)
    return (DRAFTS_PREFIX + publishedId) as DraftId
  }

  return isDraftId(id) ? id : ((DRAFTS_PREFIX + id) as DraftId)
}

/** @internal */
export const systemBundles = ['drafts', 'published'] as const

/** @internal */
export type SystemBundle = (typeof systemBundles)[number]

/** @internal */
export function isSystemBundle(maybeSystemBundle: unknown): maybeSystemBundle is SystemBundle {
  return systemBundles.includes(maybeSystemBundle as SystemBundle)
}

/** @internal */
const systemBundleNames = ['draft', 'published'] as const

/** @internal */
type SystemBundleName = (typeof systemBundleNames)[number]

/**
 * `isSystemBundle` should be preferred, but some parts of the codebase currently use the singular
 * "draft" name instead of the plural "drafts".
 *
 * @internal
 */
export function isSystemBundleName(
  maybeSystemBundleName: unknown,
): maybeSystemBundleName is SystemBundleName {
  return systemBundleNames.includes(maybeSystemBundleName as SystemBundleName)
}

/**  @internal */
export function getVersionId(id: string, version: string): string {
  if (isSystemBundle(version)) {
    throw new Error('Version can not be "published" or "drafts"')
  }

  return `${VERSION_PREFIX}${version}${PATH_SEPARATOR}${getPublishedId(id)}`
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
  versions: T[]
}

/** @internal */
export function collate<T extends {_id: string; _type: string}>(documents: T[]): CollatedHit<T>[] {
  const byId = documents.reduce((res, doc) => {
    const publishedId = getPublishedId(doc._id)
    let entry = res.get(publishedId)
    if (!entry) {
      entry = {
        id: publishedId,
        type: doc._type,
        published: undefined,
        draft: undefined,
        versions: [],
      }
      res.set(publishedId, entry)
    }

    if (isPublishedId(doc._id)) {
      entry.published = doc
    }

    if (isDraftId(doc._id)) {
      entry.draft = doc
    }

    if (isVersionId(doc._id)) {
      entry.versions.push(doc)
    }

    return res
  }, new Map())

  return Array.from(byId.values())
}

/** @internal */
// Removes published documents that also has a draft
export function removeDupes(documents: SanityDocumentLike[]): SanityDocumentLike[] {
  return collate(documents)
    .map((entry) => entry.draft || entry.published || entry.versions[0])
    .filter(isNonNullable)
}
