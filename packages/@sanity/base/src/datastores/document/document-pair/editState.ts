import {SanityDocument} from '@sanity/types'
import {combineLatest, concat, EMPTY, Observable, of, timer} from 'rxjs'
import {map, mapTo, publishReplay, refCount, scan, startWith, switchMap, tap} from 'rxjs/operators'
import {IdPair, PublishEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {snapshotPair} from './snapshotPair'

interface PublishState {
  isPublishing: boolean
  phase: 'init' | 'submitted' | 'received' | 'success'
  // will be true if the current client initiated the publish
  local: boolean
}

export interface EditStateFor {
  id: string
  type: string
  publishState: PublishState | null
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}

export const editState = memoize(
  (idPair: IdPair, typeName: string): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(typeName)
    return snapshotPair(idPair, typeName).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.publishEvents$.pipe(
            switchMap((ev) =>
              // reset after 2s unless there's a new event coming in
              concat(of(ev), ev?.phase === 'success' ? timer(2000).pipe(mapTo(null)) : EMPTY)
            ),
            scan((acc: PublishState | null, ev: PublishEvent) => {
              return ev === null
                ? null
                : {
                    isPublishing:
                      ev.phase === 'init' || ev.phase === 'submitted' || ev.phase === 'received',
                    phase: ev.phase,
                    local: ev.phase === 'init' ? true : acc?.local,
                    lastPublish: ev.phase === 'success' ? new Date() : null,
                  }
            }, null),
            startWith(null)
          ),
        ])
      ),
      map(([draftSnapshot, publishedSnapshot, publishState]) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: draftSnapshot,
        published: publishedSnapshot,
        liveEdit,
        ready: true,
        publishState,
      })),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        draft: null,
        publishing: false,
        published: null,
        liveEdit,
        ready: false,
        publishState: null,
      }),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
