/* eslint-disable @typescript-eslint/no-redeclare */
import {type DocumentId, isVersionId} from '@sanity/id-utils'
import {customAlphabet} from 'nanoid'
import {type Brand, make} from 'ts-brand'

import {getPublishedId} from '../../util'
import {
  PATH_SEPARATOR,
  RELEASE_DOCUMENTS_PATH,
  RELEASE_DOCUMENTS_PATH_PREFIX,
  VERSION_PREFIX,
} from '../store/constants'

/**
 * @internal
 */
export type ReleaseId = Brand<string, 'releaseId'>
/**
 * @internal
 */
export type ReleaseDocumentId = Brand<string, 'releaseDocumentId'>

/**
 * @internal
 */
export const ReleaseId = make<ReleaseId>((input: string) => {
  validateBundleId(input)
  return input
})
/**
 * @internal
 */
export const ReleaseDocumentId = make<ReleaseDocumentId>((input: string) => {
  validateReleaseDocumentId(input)
  return input
})

function validateBundleId(input: string) {
  // todo: consider validation here
  //if (!input.startsWith('r') || input.length !== 9) {
  //  throw new Error(
  //    `'Invalid release id "${input}" – Release Ids should be 9 characters and start with 'r'`,
  //  )
  // }
}

function validateReleaseDocumentId(input: string) {
  if (!input.startsWith(RELEASE_DOCUMENTS_PATH_PREFIX)) {
    throw new Error(
      `'Invalid release document id "${input}" – Release document Ids must be in the ${RELEASE_DOCUMENTS_PATH} path`,
    )
  }
  validateBundleId(input.slice(RELEASE_DOCUMENTS_PATH_PREFIX.length))
}

/**
 * ~24 years (or 7.54e+8 seconds) needed, in order to have a 1% probability of at least one collision if 10 ID's are generated every hour.
 */
const _generateReleaseId = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)

export function generateReleaseId() {
  return ReleaseId(_generateReleaseId())
}

/**
 * Create a unique release id. This is used as the release id for documents included in the release.
 * @internal
 */
export function generateReleaseDocumentId() {
  return ReleaseDocumentId(`${RELEASE_DOCUMENTS_PATH}.r${_generateReleaseId()}`)
}

/**
 * @internal
 * @param releaseId - the document id of the release
 */
export function getReleaseIdFromReleaseDocumentId(releaseId: ReleaseDocumentId) {
  return ReleaseId(releaseId.slice(RELEASE_DOCUMENTS_PATH_PREFIX.length))
}

/**  @internal */
export function getVersionId(id: DocumentId, release: ReleaseId): string {
  if (isVersionId(id)) {
    const [, versionId, ...publishedId] = id.split(PATH_SEPARATOR)
    if (versionId === release) return id
    return `${VERSION_PREFIX}${release}${PATH_SEPARATOR}${publishedId}`
  }

  const publishedId = getPublishedId(id)

  return `${VERSION_PREFIX}${release}${PATH_SEPARATOR}${publishedId}`
}
