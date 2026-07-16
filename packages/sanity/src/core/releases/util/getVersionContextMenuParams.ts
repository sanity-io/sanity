import {type DocumentPermission} from '../../store/grants/documentPairPermissions'
import {getDraftId, getPublishedId, getVersionFromId, isVersionId} from '../../util/draftUtils'
import {isDraftVersion, isPublishedVersion, readVersionType} from '../../util/versionsUtils'
import {type VersionInfoDocumentStub} from '../store/types'
import {getReleaseIdFromReleaseDocumentId} from './getReleaseIdFromReleaseDocumentId'

/**
 * Derived context for a version context menu from a {@link VersionInfoDocumentStub}.
 *
 * @internal
 */
export interface VersionContextMenuParams {
  documentId: string
  /** The perspective the menu acts on: 'published', 'draft', or a release/scope id. */
  bundleId: string
  isVersion: boolean
  isPublished: boolean
  /** Scope id passed to permission checks for version documents. */
  permissionVersion: string | undefined
  permission: DocumentPermission
}

/**
 * Derives version context menu parameters from a version document stub.
 *
 * @internal
 */
export function getVersionContextMenuParams(
  versionDocument: VersionInfoDocumentStub,
): VersionContextMenuParams {
  const documentId = getPublishedId(versionDocument._id)
  const versionType = readVersionType(versionDocument)
  const isPublished = versionType === 'published' && isPublishedVersion(versionDocument)
  const isBaseDraft =
    versionType === 'draft' &&
    isDraftVersion(versionDocument, {constraint: {baseVariant: true}}) &&
    !isVersionId(versionDocument._id)
  const isVersion = !isPublished && !isBaseDraft

  let bundleId: string
  if (isPublished) {
    bundleId = 'published'
  } else if (isBaseDraft) {
    bundleId = 'draft'
  } else if (versionDocument._system.release?._ref) {
    bundleId = getReleaseIdFromReleaseDocumentId(versionDocument._system.release._ref)
  } else {
    bundleId = versionDocument._system.scopeId ?? getVersionFromId(versionDocument._id) ?? ''
  }

  const permissionVersion = isVersion
    ? (versionDocument._system.scopeId ?? getVersionFromId(versionDocument._id))
    : undefined

  const permission: DocumentPermission = isBaseDraft ? 'discardDraft' : 'discardVersion'

  return {
    documentId,
    bundleId,
    isVersion,
    isPublished,
    permissionVersion,
    permission,
  }
}

/**
 * Finds a version document stub for a release, or synthesizes one when the
 * version document does not exist yet.
 *
 * @internal
 */
export function getReleaseVersionDocumentStub(
  documentVersions: VersionInfoDocumentStub[],
  releaseDocumentId: string,
  documentGroupId: string,
): VersionInfoDocumentStub {
  const existing = documentVersions.find(
    (version) => version._system.release?._ref === releaseDocumentId,
  )
  if (existing) {
    return existing
  }

  const releaseId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
  const publishedId = getPublishedId(documentGroupId)

  return {
    _id: `versions.${releaseId}.${publishedId}`,
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    _system: {
      bundleId: releaseId,
      release: {_ref: releaseDocumentId, _weak: true},
      group: {_ref: publishedId, _weak: true},
      scopeId: releaseId,
    },
  }
}

/**
 * Finds a base published/draft version document stub, or synthesizes one when
 * the document does not exist yet.
 *
 * @internal
 */
export function getBaseVersionDocumentStub(
  documentVersions: VersionInfoDocumentStub[],
  documentGroupId: string,
  bundle: 'published' | 'draft',
): VersionInfoDocumentStub {
  const publishedId = getPublishedId(documentGroupId)
  const existing = documentVersions.find((version) =>
    bundle === 'published'
      ? isPublishedVersion(version, {constraint: {baseVariant: true}})
      : isDraftVersion(version, {constraint: {baseVariant: true}}),
  )
  if (existing) {
    return existing
  }

  return bundle === 'published'
    ? {
        _id: publishedId,
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {group: {_ref: publishedId, _weak: true}},
      }
    : {
        _id: getDraftId(publishedId),
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {bundleId: 'drafts', group: {_ref: publishedId, _weak: true}},
      }
}
