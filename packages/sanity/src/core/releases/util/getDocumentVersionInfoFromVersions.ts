import {isDraftVersion, isPublishedVersion, isVariantVersion} from '../../util'
import {type VersionInfoDocumentStub} from '../store/types'
import {getReleaseIdFromReleaseDocumentId} from './getReleaseIdFromReleaseDocumentId'

function exists(value: VersionInfoDocumentStub | undefined): value is VersionInfoDocumentStub {
  return Boolean(value?._rev)
}

const EMPTY_RESULT = {
  draft: undefined,
  published: undefined,
  versions: {},
} as const

/**
 * Derives the legacy `useDocumentVersionInfo` shape from `useDocumentVersions.versions`.
 *
 * @internal
 */
export function getDocumentVersionInfoFromVersions(versions: VersionInfoDocumentStub[]): {
  draft: VersionInfoDocumentStub | undefined
  published: VersionInfoDocumentStub | undefined
  versions: Record<string, VersionInfoDocumentStub | undefined>
} {
  const groupId = versions[0]?._system.group._ref

  if (!groupId) {
    return EMPTY_RESULT
  }

  const areAllVersionsInSameGroup = versions.every(
    (version) => version._system.group._ref === groupId,
  )
  if (!areAllVersionsInSameGroup) {
    throw new Error('Some versions are not in the same group, this is not supported')
  }

  const nonVariantVersions = versions.filter((version) => !isVariantVersion(version))

  const published = nonVariantVersions.find(isPublishedVersion)
  const draft = nonVariantVersions.find(isDraftVersion)

  const releaseVersions: Record<string, VersionInfoDocumentStub | undefined> = {}

  for (const version of nonVariantVersions) {
    const releaseId = version._system.release?._ref

    if (releaseId) {
      releaseVersions[getReleaseIdFromReleaseDocumentId(releaseId)] = exists(version)
        ? version
        : undefined
    }
  }

  return {
    draft: exists(draft) ? draft : undefined,
    published: exists(published) ? published : undefined,
    versions: releaseVersions,
  }
}
