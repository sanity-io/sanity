import {type PreviewValue, type SanityDocument, type SchemaType} from '@sanity/types'
import {omit} from 'lodash'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {map, mergeMap, scan, startWith} from 'rxjs/operators'
import {type PreparedSnapshot} from 'sanity'

import {type ReleaseId} from '../../releases'
import {getDraftId, getPublishedId, getVersionId} from '../../util/draftUtils'
import {type DocumentPreviewStore} from '../documentPreviewStore'

/**
 * @internal
 */
export type VersionsRecord = Record<ReleaseId, PreparedSnapshot>

export type VersionTuple = [bundleId: ReleaseId, snapshot: PreparedSnapshot]

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
  /**
   * What additional releases to fetch versions from
   */
  releases: ReleaseId[] = [],
): Observable<PreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : documentPreviewStore.observeForPreview({_id: getDraftId(documentId)}, schemaType)

  const versions$ = from(releases).pipe(
    mergeMap((release) =>
      documentPreviewStore
        .observeForPreview({_id: getVersionId(documentId, release)}, schemaType)
        .pipe(map((storeValue): VersionTuple => [release, storeValue])),
    ),
    scan((byVersionId, [releaseId, value]) => {
      if (value.snapshot === undefined) {
        return omit({...byVersionId}, [releaseId])
      }

      return {
        ...byVersionId,
        [releaseId]: value,
      }
    }, {}),
    startWith<VersionsRecord>({}),
  )

  const published$ = documentPreviewStore.observeForPreview(
    {_id: getPublishedId(documentId)},
    schemaType,
  )

  return combineLatest([draft$, published$, versions$]).pipe(
    map(([draft, published, versions]) => ({
      draft: draft.snapshot,
      isLoading: false,
      published: published.snapshot,
      versions,
    })),
    startWith({
      draft: undefined,
      isLoading: true,
      published: undefined,
      versions: {},
    }),
  )
}
