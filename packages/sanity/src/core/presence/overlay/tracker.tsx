import {memo, useContext} from 'react'
import {PresenceTrackerContextGetSnapshot, PresenceTrackerContextStore} from 'sanity/_singletons'

import {
  type Reported,
  type ReporterHook,
  type TrackerContextGetSnapshot,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../../components/react-track-elements'
import {type FieldPresenceData} from '../types'

export type ReportedPresenceData = Reported<FieldPresenceData>

function PresenceTrackerComponent(props: {children: React.ReactNode}) {
  const {children} = props
  const {store, snapshot} = useTrackerStore<FieldPresenceData>()

  return (
    <PresenceTrackerContextStore.Provider value={store}>
      <PresenceTrackerContextGetSnapshot.Provider value={snapshot}>
        {children}
      </PresenceTrackerContextGetSnapshot.Provider>
    </PresenceTrackerContextStore.Provider>
  )
}

/**
 * @internal
 */
export const PresenceTracker = memo(PresenceTrackerComponent)

const EMPTY_ARRAY: Reported<FieldPresenceData>[] = []

/**
 * @internal
 */
export function usePresenceReportedValues(): TrackerContextGetSnapshot<FieldPresenceData> {
  const snapshot = useContext(PresenceTrackerContextGetSnapshot)

  if (snapshot === null) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "usePresenceReportedValues()", is wrapped inside a <PresenceTracker> element',
      ),
    )
    return EMPTY_ARRAY
  }

  return snapshot
}

/**
 * @internal
 */
export const usePresenceReporter: ReporterHook<FieldPresenceData> = (id, value, isEqual?) => {
  const store = useContext(PresenceTrackerContextStore)

  if (store === null) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "usePresenceReporter()", is wrapped inside a <PresenceTracker> element',
      ),
    )
  }

  useTrackerStoreReporter<FieldPresenceData>(store, id, value, isEqual)
}
