import type {
  ChangeIndicatorTrackerContextStoreType,
  ChangeIndicatorTrackerGetSnapshotType,
} from '../../core/changeIndicators/ChangeIndicatorTrackerContexts'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const ChangeIndicatorTrackerContextStore =
  createContext<ChangeIndicatorTrackerContextStoreType>(
    'sanity/_singletons/context/change-indicator-tracker-store',
    null,
  )

/** @internal */
export const ChangeIndicatorTrackerContextGetSnapshot =
  createContext<ChangeIndicatorTrackerGetSnapshotType>(
    'sanity/_singletons/context/change-indicator-tracker-get-snapshot',
    null,
  )
