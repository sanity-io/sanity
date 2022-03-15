import {SanityClient} from '@sanity/client'
import {combineLatest, Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {SanityDocument} from '@sanity/types'
import {getIdPair, PublishedId} from '../util/draftUtils'
import {isRecord} from '../util/isRecord'
import {DraftsModelDocument, ObservePathsFn, Path} from './types'
import {create_preview_availability} from './availability'

export function create_preview_documentPair(
  versionedClient: SanityClient,
  observePaths: ObservePathsFn
) {
  const {observeDocumentPairAvailability} = create_preview_availability(
    versionedClient,
    observePaths
  )

  const ALWAYS_INCLUDED_SNAPSHOT_PATHS: Path[] = [['_updatedAt'], ['_createdAt'], ['_type']]

  return {observePathsDocumentPair}

  function observePathsDocumentPair<T extends SanityDocument = SanityDocument>(
    id: PublishedId,
    paths: Path[]
  ): Observable<DraftsModelDocument<T>> {
    const {draftId, publishedId} = getIdPair(id)

    return observeDocumentPairAvailability(id).pipe(
      switchMap((availability) => {
        if (!availability.draft.available && !availability.published.available) {
          // short circuit, neither draft nor published is available so no point in trying to get a snapshot
          return of({
            id,
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
          observePaths(draftId, snapshotPaths),
          observePaths(publishedId, snapshotPaths),
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
              type,
              draft: {
                availability: availability.draft,
                snapshot: draftSnapshot as T,
              },
              published: {
                availability: availability.published,
                snapshot: publishedSnapshot as T,
              },
            }
          })
        )
      })
    )
  }
}
