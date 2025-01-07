import {useCallback, useEffect, useMemo} from 'react'
import deepEquals from 'react-fast-compare'
import {useObservable} from 'react-rx'
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs'
import {useDocumentPane} from 'sanity/structure'

import {type PathSyncChannelProps, type PathSyncState} from '../types/pathSyncChannel'

/**
 * Synchronise the open path between multiple document panes.
 *
 * @internal
 */
export function usePathSyncChannel({syncChannel, id}: PathSyncChannelProps): void {
  const {onPathOpen: open, openPath} = useDocumentPane()

  const push = useCallback(
    (state: PathSyncState) => syncChannel.next({...state, source: id}),
    [id, syncChannel],
  )

  const currentPath = useMemo(
    () =>
      syncChannel.pipe(
        distinctUntilChanged<PathSyncState>((previous, next) =>
          deepEquals(previous.path, next.path),
        ),
        debounceTime(5),
        filter(({source}) => source !== id),
        map(({path}) => path),
      ),
    [id, syncChannel],
  )

  const currentPathValue = useObservable(currentPath, [])

  // When the path in this pane changes, broadcast it to the other panes.
  useEffect(() => push({path: openPath}), [openPath, push])

  // When a path change occurs in another pane, apply it to this pane.
  useEffect(() => open(currentPathValue), [currentPathValue, open])
}
