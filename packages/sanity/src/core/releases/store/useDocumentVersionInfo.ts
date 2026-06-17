import {getPublishedId} from '@sanity/client/csm'
import {useMemo} from 'react'

import {useDocumentVersions} from '../hooks/useDocumentVersions'
import {getDocumentVersionInfoFromVersions} from '../util/getDocumentVersionInfoFromVersions'
import {type VersionInfoDocumentStub} from './types'

const NO_VERSIONS = {} as Record<string, VersionInfoDocumentStub | undefined>

/**
 * Takes a document id, and returns information about what other versions of the document currently exists.
 *
 * @param documentId - The document id. Should be the published id
 * @deprecated Use {@link useDocumentVersions} instead.
 */
export function useDocumentVersionInfo(documentId: string) {
  const publishedId = getPublishedId(documentId)
  const {versions, loading} = useDocumentVersions({documentId: publishedId})
  const versionInfo = useMemo(() => getDocumentVersionInfoFromVersions(versions), [versions])

  return {
    isLoading: loading,
    draft: versionInfo.draft,
    published: versionInfo.published,
    versions: loading ? NO_VERSIONS : versionInfo.versions,
  }
}
