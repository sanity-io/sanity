import {type CurrentUser, type Schema} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {distinctUntilChanged, filter, map, shareReplay, startWith, switchMap} from 'rxjs/operators'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSource} from '../../../studio'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'
import {getPublishedArchivedReleaseDocumentsObservable} from './getPublishedArchivedReleaseDocumentsObservable'
import {type DocumentInRelease} from './types'
import {
  type BundleDocumentsObservableResult,
  getBundleDocumentsObservable,
} from './useBundleDocuments'

const getReleaseDocumentsObservable = ({
  schema,
  documentPreviewStore,
  getClient,
  releaseId,
  i18n,
  releasesState$,
  currentUser,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  i18n: LocaleSource
  releasesState$: ReturnType<typeof useReleasesStore>['state$']
  currentUser?: Omit<CurrentUser, 'role'> | null
}): BundleDocumentsObservableResult => {
  return releasesState$.pipe(
    map((releasesState) =>
      releasesState.releases.get(getReleaseDocumentIdFromReleaseId(releaseId)),
    ),
    filter(Boolean), // Removes falsey values
    distinctUntilChanged((prev, next) => {
      // Only skip re-validation if the core fields that affect document validation haven't changed
      // Return true to skip, false to trigger re-validation
      // _rev wasn't enough since it changed on every edit of the release document itself
      return prev.state === next.state && prev.finalDocumentStates === next.finalDocumentStates
    }),
    switchMap((release) => {
      // Published and archived releases are terminal and fetched from history;
      // the observable caches itself by `<releaseId>-archived`.
      if (release.state === 'published' || release.state === 'archived') {
        return getPublishedArchivedReleaseDocumentsObservable({getClient, release})
      }

      // The document fetching/validation is cached in `getBundleDocumentsObservable` by `cacheKey`,
      // which is derived from the release fields that affect document validation (+ `_rev`).
      const cacheKey = [
        releaseId,
        release.state,
        release.finalDocumentStates?.flatMap((doc) => doc.id),
        release._rev,
      ].join('-')

      return getBundleDocumentsObservable({
        schema,
        documentPreviewStore,
        i18n,
        getClient,
        currentUser,
        groqFilter: `sanity::partOfRelease($releaseId)`,
        params: {releaseId},
        skipValidation: isGoingToUnpublish,
        cacheKey,
      })
    }),
    startWith({loading: true, results: [], error: null}),
    shareReplay(1),
  )
}

/**
 * Hook to fetch the documents that belong to a release.
 *
 * Decides, based on the release state, whether to use the generic active-release pipeline
 * ({@link getBundleDocumentsObservable}) or the published/archived history pipeline
 * ({@link getPublishedArchivedReleaseDocumentsObservable}).
 *
 * @internal
 */
export function useReleaseDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()
  const {state$: releasesState$} = useReleasesStore()

  const releaseDocumentsObservable = useMemo(
    () =>
      getReleaseDocumentsObservable({
        schema,
        documentPreviewStore,
        getClient,
        releaseId,
        i18n,
        releasesState$,
        currentUser,
      }),
    [schema, documentPreviewStore, getClient, releaseId, i18n, releasesState$, currentUser],
  )

  return useObservable(releaseDocumentsObservable, {
    loading: true,
    results: [],
    error: null,
  })
}
