import {type PreviewValue, type SanityDocument, type SchemaType} from '@sanity/types'
import {omit} from 'lodash'
import {type ReactNode} from 'react'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {map, mergeMap, scan, startWith} from 'rxjs/operators'
import {type PreparedSnapshot} from 'sanity'

import {getDraftId, getPublishedId, getVersionId} from '../../util/draftUtils'
import {type DocumentPreviewStore} from '../documentPreviewStore'

/**
 * @internal
 */
export type VersionsRecord = Record<string, PreparedSnapshot>

type VersionTuple = [bundleId: string, snapshot: PreparedSnapshot]

export interface PreviewState {
  isLoading?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  version?: PreviewValue | Partial<SanityDocument> | null
  versions: VersionsRecord
}

const isLiveEditEnabled = (schemaType: SchemaType) => schemaType.liveEdit === true

/**
 * Obtain a document's published and draft state, along with loading status.
 *
 * @internal
 */
export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: ReactNode,
  perspective: {
    /**
     * An array of all existing bundle ids.
     */
    bundleIds: string[]

    /**
     * An array of release ids ordered chronologically to represent the state of documents at the
     * given point in time.
     */
    bundleStack: string[]
  } = {
    bundleIds: [],
    bundleStack: [],
  },
): Observable<PreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : documentPreviewStore.observeForPreview({_id: getDraftId(documentId)}, schemaType)

  const versions$ = from(perspective.bundleIds).pipe(
    mergeMap<string, Observable<VersionTuple>>((bundleId) =>
      documentPreviewStore
        .observeForPreview({_id: getVersionId(documentId, bundleId)}, schemaType)
        .pipe(map((storeValue) => [bundleId, storeValue])),
    ),
    scan<VersionTuple, VersionsRecord>((byBundleId, [bundleId, value]) => {
      if (value.snapshot === null) {
        return omit({...byBundleId}, [bundleId])
      }

      return {
        ...byBundleId,
        [bundleId]: value,
      }
    }, {}),
    startWith<VersionsRecord>({}),
  )

  // Iterate the release stack in descending precedence, returning the highest precedence existing
  // version document.
  const version$ = versions$.pipe(
    map((versions) => {
      for (const bundleId of perspective.bundleStack) {
        if (bundleId in versions) {
          return versions[bundleId]
        }
      }
      return {snapshot: null}
    }),
    startWith<PreparedSnapshot>({snapshot: null}),
  )

  const published$ = documentPreviewStore.observeForPreview(
    {_id: getPublishedId(documentId)},
    schemaType,
  )

  return combineLatest([draft$, published$, version$, versions$]).pipe(
    map(([draft, published, version, versions]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot || {})} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot || {})} : null,
      version: version.snapshot ? {title, ...(version.snapshot || {})} : null,
      versions,
    })),
    startWith({
      draft: null,
      isLoading: true,
      published: null,
      version: null,
      versions: {},
    }),
  )
}
