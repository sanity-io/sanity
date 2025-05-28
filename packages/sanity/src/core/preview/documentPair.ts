import {type SanityDocument} from '@sanity/types'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'

import {getIdPair, isRecord} from '../util'
import {
  type DraftsModelDocument,
  type ObserveDocumentAvailabilityFn,
  type ObservePathsFn,
  type PreviewPath,
} from './types'

export function createObservePathsDocumentPair(options: {
  observeDocumentPairAvailability: ObserveDocumentAvailabilityFn
  observePaths: ObservePathsFn
}): <T extends SanityDocument = SanityDocument>(
  id: string,
  paths: PreviewPath[],
) => Observable<DraftsModelDocument<T>> {
  const {observeDocumentPairAvailability, observePaths} = options

  const ALWAYS_INCLUDED_SNAPSHOT_PATHS: PreviewPath[] = [['_updatedAt'], ['_createdAt'], ['_type']]

  return function observePathsDocumentPair<T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[],
    {version}: {version?: string} = {},
  ): Observable<DraftsModelDocument<T>> {
    const {draftId, publishedId, versionId} = getIdPair(id, {version})

    return observeDocumentPairAvailability(draftId, {version}).pipe(
      switchMap((availability) => {
        if (
          !availability.draft.available &&
          !availability.published.available &&
          !availability.version?.available
        ) {
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
            ...(availability.version
              ? {
                  version: {
                    availability: availability.version,
                    snapshot: undefined,
                  },
                }
              : {}),
          })
        }

        const snapshotPaths = [...paths, ...ALWAYS_INCLUDED_SNAPSHOT_PATHS]

        return combineLatest([
          observePaths({_type: 'reference', _ref: draftId}, snapshotPaths),
          observePaths({_type: 'reference', _ref: publishedId}, snapshotPaths),
          ...(version ? [observePaths({_type: 'reference', _ref: versionId}, snapshotPaths)] : []),
        ]).pipe(
          map(([draftSnapshot, publishedSnapshot, versionSnapshot]) => {
            // note: assume type is always the same
            const type =
              (isRecord(versionSnapshot) && '_type' in versionSnapshot && versionSnapshot._type) ||
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
              ...(availability.version
                ? {
                    version: {
                      availability: availability.version,
                      snapshot: versionSnapshot as T,
                    },
                  }
                : {}),
            }
          }),
        )
      }),
    )
  }
}
