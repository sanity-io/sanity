import {memo, useContext} from 'react'
import {
  ChangeIndicatorTrackerContextGetSnapshot,
  ChangeIndicatorTrackerContextStore,
} from 'sanity/_singletons'

import {
  type Reported,
  type ReporterHook,
  type TrackerContextGetSnapshot,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../components/react-track-elements'
import {type ChangeIndicatorTrackerContextValue} from './types'

export * from './types'

function ChangeIndicatorsTrackerComponent(props: {children: React.ReactNode}) {
  const {children} = props
  const {store, snapshot} = useTrackerStore<ChangeIndicatorTrackerContextValue>()

  return (
    <ChangeIndicatorTrackerContextStore.Provider value={store}>
      <ChangeIndicatorTrackerContextGetSnapshot.Provider value={snapshot}>
        {children}
      </ChangeIndicatorTrackerContextGetSnapshot.Provider>
    </ChangeIndicatorTrackerContextStore.Provider>
  )
}

/**
 * @internal
 */
export const ChangeIndicatorsTracker = memo(ChangeIndicatorsTrackerComponent)

const EMPTY_ARRAY: Reported<ChangeIndicatorTrackerContextValue>[] = []

/**
 * @internal
 */
export function useChangeIndicatorsReportedValues(): TrackerContextGetSnapshot<ChangeIndicatorTrackerContextValue> {
  const snapshot = useContext(ChangeIndicatorTrackerContextGetSnapshot)

  if (snapshot === null) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "useChangeIndicatorsReportedValues()", is wrapped inside a <ChangeIndicatorsTracker> element',
      ),
    )
    return EMPTY_ARRAY
  }

  return snapshot
}

/**
 * @internal
 */
export const useChangeIndicatorsReporter: ReporterHook<ChangeIndicatorTrackerContextValue> = (
  id,
  value,
  isEqual?,
) => {
  const store = useContext(ChangeIndicatorTrackerContextStore)

  if (store === null) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "useChangeIndicatorsReporter()", is wrapped inside a <ChangeIndicatorsTracker> element',
      ),
    )
  }

  useTrackerStoreReporter<ChangeIndicatorTrackerContextValue>(store, id, value, isEqual)
}
