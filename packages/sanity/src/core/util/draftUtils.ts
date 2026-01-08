import {type StackablePerspective} from '@sanity/client'
import {
  type DraftId,
  DRAFTS_FOLDER,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
  isVersionId,
  type PublishedId,
  VERSION_FOLDER,
} from '@sanity/client/csm'
import {type SanityDocument, type SanityDocumentLike} from '@sanity/types'

import {isNonNullable} from './isNonNullable'

export {
  type DraftId,
  DRAFTS_FOLDER,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
  isVersionId,
  type PublishedId,
  VERSION_FOLDER,
}

const PATH_SEPARATOR = '.'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}${PATH_SEPARATOR}`

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

/**
 * System bundles are sets of documents owned by the system.
 *
 * - Draft documents contain data that has not yet been published. These documents all exist in the "drafts" path.
 * - Published documents contain data that has been published. These documents all exist in the root path.
 *
 * These differ to user bundles, which are created when a user establishes a custom set of documents
 * (e.g. by creating a release).
 *
 * @public
 */
export const systemBundles = ['drafts', 'published'] as const

/**
 * System bundles are sets of documents owned by the system.
 *
 * - Draft documents contain data that has not yet been published. These documents all exist in the "drafts" path.
 * - Published documents contain data that has been published. These documents all exist in the root path.
 *
 * These differ to user bundles, which are created when a user establishes a custom set of documents
 * (e.g. by creating a release).
 *
 * @public
 */
export type SystemBundle = 'drafts' | 'published'

/** @internal */
export function isSystemBundle(maybeSystemBundle: unknown): maybeSystemBundle is SystemBundle {
  return systemBundles.includes(maybeSystemBundle as SystemBundle)
}

/** @internal */
const systemBundleNames = ['draft', 'published'] as const

/** @internal */
type SystemBundleName = 'draft' | 'published'

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

/**
 *  @internal
 *  Given a perspective stack and a document id, returns true if the document id matches any of the provided perspectives
 *  e.g. `idMatchesPerspective('['summer'], 'versions.summer.foo') === true`
 *  e.g. `idMatchesPerspective('['drafts', 'summer'], 'versions.summer.foo') === true`
 *  e.g. `idMatchesPerspective('['drafts'], 'versions.summer.foo') === false`
 *  e.g. `idMatchesPerspective('['drafts', 'summer'], 'versions.winter.foo') === false`
 *
 * Note: a published id will match any perspective
 *   e.g. `idMatchesPerspective('['drafts', 'summer'], 'foo') === true`
 */
export function idMatchesPerspective(
  perspectiveStack: StackablePerspective[],
  documentId: string,
): boolean {
  if (isPublishedId(documentId)) {
    return true
  }
  return perspectiveStack.some((perspective) => {
    if (perspective === 'drafts') {
      return isDraftId(documentId)
    }
    return getVersionFromId(documentId) === perspective
  })
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
