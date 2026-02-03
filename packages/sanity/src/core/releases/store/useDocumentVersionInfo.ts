import {getPublishedId} from '@sanity/client/csm'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, of} from 'rxjs'
import {map} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../../store'
import {getDraftId, getVersionId} from '../../util'
import {type VersionInfoDocumentStub} from './types'
import {useActiveReleases} from './useActiveReleases'
import {useReleasesIds} from './useReleasesIds'

function exists(value: any) {
  return value?._rev
}
const DOCUMENT_STUB_PATHS = ['_id', '_type', '_rev', '_createdAt', '_updatedAt']

const NO_VERSIONS = {} as Record<string, VersionInfoDocumentStub | undefined>

/**
 * Takes a document id, and returns information about what other versions of the document currently exists
 * @param documentId - The document id. Should be the published id
 * @internal
 */
export function useDocumentVersionInfo(documentId: string) {
  const documentPreviewStore = useDocumentPreviewStore()
  const releaseIds = useReleasesIds(useActiveReleases().data).releasesIds
  const [draftId, publishedId] = [getDraftId(documentId), getPublishedId(documentId)]

  const observable = useMemo(() => {
    const releaseVersions =
      releaseIds.length > 0
        ? combineLatest(
            Object.fromEntries(
              releaseIds.map((releaseId) => [
                releaseId,
                documentPreviewStore
                  .observePaths({_id: getVersionId(publishedId, releaseId)}, DOCUMENT_STUB_PATHS)
                  .pipe(
                    map((value) =>
                      exists(value) ? (value as VersionInfoDocumentStub) : undefined,
                    ),
                  ),
              ]),
            ),
          )
        : of(NO_VERSIONS)

    return combineLatest({
      isLoading: of(false),
      draft: documentPreviewStore
        .observePaths({_id: draftId}, DOCUMENT_STUB_PATHS)
        .pipe(map((value) => (exists(value) ? (value as VersionInfoDocumentStub) : undefined))),
      published: documentPreviewStore
        .observePaths({_id: publishedId}, DOCUMENT_STUB_PATHS)
        .pipe(map((value) => (exists(value) ? (value as VersionInfoDocumentStub) : undefined))),
      versions: releaseVersions,
    })
  }, [draftId, documentPreviewStore, publishedId, releaseIds])

  return useObservable(observable, {
    isLoading: true,
    versions: NO_VERSIONS,
    draft: undefined,
    published: undefined,
  })
}
