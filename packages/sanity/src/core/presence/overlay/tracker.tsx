import {memo, useContext} from 'react'
import {PresenceTrackerContextGetSnapshot, PresenceTrackerContextStore} from 'sanity/_singletons'

import {
  createTrackerScope,
  type Reported,
  type ReporterHook,
  type TrackerContextGetSnapshot,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../../components/react-track-elements'
import {type FieldPresenceData} from '../types'

export type ReportedPresenceData = Reported<FieldPresenceData>

const variant: '1' | '2' = '2'

const {
  Tracker: PresenceTrackerV1,
  useReporter: useReporterV1,
  useReportedValues: useReportedValuesV1,
} = createTrackerScope<FieldPresenceData>()

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
export const PresenceTrackerV2 = memo(PresenceTrackerComponent)

const EMPTY_ARRAY: Reported<FieldPresenceData>[] = []

/**
 * @internal
 */
export function usePresenceReportedValuesV2(): TrackerContextGetSnapshot<FieldPresenceData> {
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
export const usePresenceReporterV2: ReporterHook<FieldPresenceData> = (id, value, isEqual?) => {
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

/**
 * @internal
 */
export const PresenceTracker = variant === '1' ? PresenceTrackerV1 : PresenceTrackerV2

/**
 * @internal
 */
export const usePresenceReportedValues =
  variant === '1' ? useReportedValuesV1 : usePresenceReportedValuesV2

/**
 * @internal
 */
export const usePresenceReporter = variant === '1' ? useReporterV1 : usePresenceReporterV2
