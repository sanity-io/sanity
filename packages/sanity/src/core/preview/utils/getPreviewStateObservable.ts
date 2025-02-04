import {type PreviewValue, type SanityDocument, type SchemaType} from '@sanity/types'
import {omit} from 'lodash'
import {type ReactNode} from 'react'
import {combineLatest, from, type Observable} from 'rxjs'
import {map, mergeMap, scan, startWith} from 'rxjs/operators'

import {type PerspectiveStack} from '../../perspective/types'
import {
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isVersionId,
} from '../../util/draftUtils'
import {type DocumentPreviewStore} from '../documentPreviewStore'
import {type PreparedSnapshot} from '../types'

/**
 * @internal
 */
export type VersionsRecord = Record<string, PreparedSnapshot>

export type VersionTuple = [bundleId: string, snapshot: PreparedSnapshot]

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
    ids: string[]

    /**
     * An array of release ids ordered chronologically to represent the state of documents at the
     * given point in time.
     */
    stack: PerspectiveStack

    /**
     * Perspective to use when fetching versions.
     * Sometimes we want to fetch versions from a perspective not bound by the stack
     * (e.g. raw).
     */
    isRaw?: boolean
  } = {
    ids: [],
    stack: [],
    isRaw: false,
  },
): Observable<PreviewState> {
  const draft$ = documentPreviewStore.observeForPreview({_id: getDraftId(documentId)}, schemaType)

  const versions$ = from(perspective.ids).pipe(
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

  const list = perspective.isRaw ? perspective.ids : perspective.stack
  // Iterate the release stack in descending precedence, returning the highest precedence existing
  // version document.
  const version$ = versions$.pipe(
    map((versions) => {
      if (perspective.isRaw && versions && isVersionId(documentId)) {
        const versionId = getVersionFromId(documentId) ?? ''
        if (versionId in versions) {
          return versions[versionId]
        }
      }
      for (const bundleId of list) {
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
