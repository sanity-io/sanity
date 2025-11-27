import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {
  ChangeIndicatorTrackerContextStoreType,
  ChangeIndicatorTrackerGetSnapshotType,
} from '../../core/changeIndicators/ChangeIndicatorTrackerContexts'

/** @internal */
export const ChangeIndicatorTrackerContextStore: Context<ChangeIndicatorTrackerContextStoreType> =
  createContext<ChangeIndicatorTrackerContextStoreType>(
    'sanity/_singletons/context/change-indicator-tracker-store',
    null,
  )

/** @internal */
export const ChangeIndicatorTrackerContextGetSnapshot: Context<ChangeIndicatorTrackerGetSnapshotType> =
  createContext<ChangeIndicatorTrackerGetSnapshotType>(
    'sanity/_singletons/context/change-indicator-tracker-get-snapshot',
    null,
  )
