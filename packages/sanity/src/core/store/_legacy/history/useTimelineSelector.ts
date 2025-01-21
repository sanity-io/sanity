import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector.js'

import {type TimelineState, type TimelineStore} from './useTimelineStore'

/**
 * Custom hook which wraps around `useSyncExternalStore`.
 * Accepts a selector function which can be used to opt-in to specific timelineStore updates.
 *
 * @internal
 */
export function useTimelineSelector<ReturnValue>(
  timelineStore: TimelineStore | undefined,
  selector: (timelineState: TimelineState) => ReturnValue,
): ReturnValue {
  if (!timelineStore) {
    throw new Error(
      'Passed timelineStore is undefined, if your are using the events timeline, call useEvents() instead. If you need to use this hook, opt in by setting the beta.eventsAPI.enabled feature flag to false',
    )
  }
  return useSyncExternalStoreWithSelector(
    timelineStore.subscribe,
    timelineStore.getSnapshot,
    null,
    selector,
  )
}
