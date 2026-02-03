import {type Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import deepEquals from 'react-fast-compare'
import {distinctUntilChanged, filter, map, type Observable} from 'rxjs'

import {type PathSyncChannelProps, type PathSyncState} from '../types/pathSyncChannel'

type Push = (state: PathSyncState) => void

/**
 * Synchronise the open path between multiple document panes.
 *
 * @internal
 */
export function usePathSyncChannel({syncChannel, id}: PathSyncChannelProps): {
  push: Push
  path: Observable<Path>
} {
  const push = useCallback<Push>(
    (state) => syncChannel.next({...state, source: id}),
    [id, syncChannel],
  )

  const path = useMemo(
    () =>
      syncChannel.pipe(
        distinctUntilChanged<PathSyncState>((previous, next) =>
          deepEquals(previous.path, next.path),
        ),
        filter(({source}) => source !== id),
        map((state) => state.path),
      ),
    [id, syncChannel],
  )

  return {
    path,
    push,
  }
}
