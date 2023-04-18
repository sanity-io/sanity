import {useSyncExternalStore} from 'react'
import {TimelineState, TimelineStore} from './useTimelineStore'

/**
 * Custom hook which wraps around `useSyncExternalStore`.
 * Accepts a selector function which can be used to opt-in to specific timelineStore updates.
 *
 * @internal
 */
export function useTimelineSelector<ReturnValue>(
  timelineStore: TimelineStore,
  selector: (timelineState: TimelineState) => ReturnValue
): ReturnValue {
  return useSyncExternalStore(timelineStore.subscribe, () => selector(timelineStore.getSnapshot()))
}
