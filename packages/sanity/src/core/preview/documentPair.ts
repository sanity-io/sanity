import {SanityClient} from '@sanity/client'
import {combineLatest, Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {SanityDocument} from '@sanity/types'
import {getIdPair, isRecord} from '../util'
import {DraftsModelDocument, ObservePathsFn, PreviewPath, Previewable} from './types'
import {create_preview_availability} from './availability'

export function create_preview_documentPair(
  versionedClient: SanityClient,
  observePaths: ObservePathsFn,
): {
  observePathsDocumentPair: <T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[],
  ) => Observable<DraftsModelDocument<T>>
} {
  const {observeDocumentPairAvailability} = create_preview_availability(
    versionedClient,
    observePaths,
  )

  const ALWAYS_INCLUDED_SNAPSHOT_PATHS: PreviewPath[] = [['_updatedAt'], ['_createdAt'], ['_type']]

  return {observePathsDocumentPair}

  function observePathsDocumentPair<T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[],
  ): Observable<DraftsModelDocument<T>> {
    const {draftId, publishedId} = getIdPair(id)

    return observeDocumentPairAvailability(draftId).pipe(
      switchMap((availability) => {
        if (!availability.draft.available && !availability.published.available) {
          // short circuit, neither draft nor published is available so no point in trying to get a snapshot
          return of({
            id: publishedId,
            type: null,
            draft: {
              availability: availability.draft,
              snapshot: undefined,
            },
            published: {
              availability: availability.published,
              snapshot: undefined,
            },
          })
        }

        const snapshotPaths = [...paths, ...ALWAYS_INCLUDED_SNAPSHOT_PATHS]

        return combineLatest([
          observePaths({_type: 'reference', _ref: draftId}, snapshotPaths),
          observePaths({_type: 'reference', _ref: publishedId}, snapshotPaths),
        ]).pipe(
          map(([draftSnapshot, publishedSnapshot]) => {
            // note: assume type is always the same
            const type =
              (isRecord(draftSnapshot) && '_type' in draftSnapshot && draftSnapshot._type) ||
              (isRecord(publishedSnapshot) &&
                '_type' in publishedSnapshot &&
                publishedSnapshot._type) ||
              null

            return {
              id: publishedId,
              type: typeof type === 'string' ? type : null,
              draft: {
                availability: availability.draft,
                snapshot: draftSnapshot as T,
              },
              published: {
                availability: availability.published,
                snapshot: publishedSnapshot as T,
              },
            }
          }),
        )
      }),
    )
  }
}
