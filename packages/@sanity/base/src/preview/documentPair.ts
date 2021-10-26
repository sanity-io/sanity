import {combineLatest, Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {SanityDocument} from '@sanity/types'
import {getIdPair, PublishedId} from '../util/draftUtils'
import {DraftsModelDocument, Path} from './types'
import {observeDocumentPairAvailability} from './availability'
import {observePaths} from './'

const ALWAYS_INCLUDED_SNAPSHOT_PATHS: Path[] = [['_updatedAt'], ['_createdAt'], ['_type']]

export function observePathsDocumentPair<T extends SanityDocument = SanityDocument>(
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
          const type = ((draftSnapshot?._type || publishedSnapshot?._type) as string) || null
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
