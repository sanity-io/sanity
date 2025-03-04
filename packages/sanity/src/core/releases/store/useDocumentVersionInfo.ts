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

/**
 * Takes a document id, and returns information about what other versions of the document currently exists
 * @param documentId - The document id. Should be the published id
 * @internal
 */
export function useDocumentVersionInfo(documentId: string) {
  const documentPreviewStore = useDocumentPreviewStore()
  const releaseIds = useReleasesIds(useActiveReleases().data).releasesIds
  const [draftId, publishedId] = [getDraftId(documentId), getPublishedId(documentId)]

  const observable = useMemo(
    () =>
      combineLatest({
        isLoading: of(false),
        draft: documentPreviewStore
          .observePaths({_id: draftId}, DOCUMENT_STUB_PATHS)
          .pipe(map((value) => (exists(value) ? (value as VersionInfoDocumentStub) : undefined))),
        published: documentPreviewStore
          .observePaths({_id: publishedId}, DOCUMENT_STUB_PATHS)
          .pipe(map((value) => (exists(value) ? (value as VersionInfoDocumentStub) : undefined))),
        versions: combineLatest(
          Object.fromEntries(
            releaseIds.map((releaseId) => [
              releaseId,
              documentPreviewStore
                .observePaths({_id: getVersionId(publishedId, releaseId)}, DOCUMENT_STUB_PATHS)
                .pipe(
                  map((value) => (exists(value) ? (value as VersionInfoDocumentStub) : undefined)),
                ),
            ]),
          ),
        ),
      }),
    [draftId, documentPreviewStore, publishedId, releaseIds],
  )
  return useObservable(observable, {
    isLoading: true,
    versions: {} as Record<string, VersionInfoDocumentStub | undefined>,
    draft: undefined,
    published: undefined,
  })
}
