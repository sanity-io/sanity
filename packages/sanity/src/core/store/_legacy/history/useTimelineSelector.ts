import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector'
import {TimelineState, TimelineStore} from './useTimelineStore'

/**
 * Custom hook which wraps around `useSyncExternalStore`.
 * Accepts a selector function which can be used to opt-in to specific timelineStore updates.
 *
 * @internal
 */
export function useTimelineSelector<ReturnValue>(
  timelineStore: TimelineStore,
  selector: (timelineState: TimelineState) => ReturnValue,
): ReturnValue {
  return useSyncExternalStoreWithSelector(
    timelineStore.subscribe,
    timelineStore.getSnapshot,
    null,
    selector,
  )
}
