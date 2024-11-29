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
      'timelineStore is not defined,  your are using events timeline, use `useEvents()` instead \n If you need to use this, opt in by setting the `beta.eventsAPI.enabled` feature flag to `true`',
    )
  }
  return useSyncExternalStoreWithSelector(
    timelineStore.subscribe,
    timelineStore.getSnapshot,
    null,
    selector,
  )
}
