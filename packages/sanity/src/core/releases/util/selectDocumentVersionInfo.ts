import {getVersionFromId, isDraftId, isPublishedId, isVersionId} from '@sanity/client/csm'

import {type DocumentPerspectiveState} from '../hooks/useDocumentVersions'
import {isExistingVersionStub} from '../store/documentVersionStub'
import {type VersionInfoDocumentStub} from '../store/types'

export interface DocumentVersionInfo {
  isLoading: boolean
  draft: VersionInfoDocumentStub | undefined
  published: VersionInfoDocumentStub | undefined
  versions: Record<string, VersionInfoDocumentStub | undefined>
}

const NO_VERSIONS = {} as Record<string, VersionInfoDocumentStub | undefined>

/**
 * Maps `useDocumentVersions` output to the legacy `{draft, published, versions}` shape
 * consumed by `DocumentStatus` and related components.
 *
 * @internal
 */
export function selectDocumentVersionInfo(
  publishedId: string,
  {versions, loading}: Pick<DocumentPerspectiveState, 'versions' | 'loading'>,
): DocumentVersionInfo {
  if (loading) {
    return {
      isLoading: true,
      draft: undefined,
      published: undefined,
      versions: NO_VERSIONS,
    }
  }

  const existingVersions = versions.filter(isExistingVersionStub)

  const draft = existingVersions.find((version) => isDraftId(version._id))
  const published = existingVersions.find(
    (version) => isPublishedId(version._id) && version._id === publishedId,
  )

  const releaseVersions = existingVersions.reduce<Record<string, VersionInfoDocumentStub>>(
    (acc, version) => {
      if (!isVersionId(version._id)) {
        return acc
      }

      const releaseId = getVersionFromId(version._id)
      if (releaseId) {
        acc[releaseId] = version
      }

      return acc
    },
    {},
  )

  return {
    isLoading: false,
    draft,
    published,
    versions: releaseVersions,
  }
}
