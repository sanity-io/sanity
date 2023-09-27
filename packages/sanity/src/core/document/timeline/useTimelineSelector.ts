import {useContext} from 'react'
import {identity} from 'rxjs'
import shallowEquals from 'shallow-equals'
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector'
import {TimelineState} from '../../store'
import {DocumentContextError} from '../DocumentContextError'
import {TimelineContext} from './TimelineContext'

/** @internal */
export function useTimelineSelector(): TimelineState
/** @internal */
export function useTimelineSelector<TReturn>(selector: (state: TimelineState) => TReturn): TReturn
/** @internal */
export function useTimelineSelector(
  selector: (state: TimelineState) => unknown = identity,
): unknown {
  const context = useContext(TimelineContext)
  if (!context) throw new DocumentContextError()

  return useSyncExternalStoreWithSelector(
    context.timelineStore.subscribe,
    context.timelineStore.getSnapshot,
    null,
    selector,
    shallowEquals,
  )
}
