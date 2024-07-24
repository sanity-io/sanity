import {createContext} from 'react'

import type {
  ChangeIndicatorTrackerContextStoreType,
  ChangeIndicatorTrackerGetSnapshotType,
} from '../../../core/changeIndicators/ChangeIndicatorTrackerContexts'

/** @internal */
export const ChangeIndicatorTrackerContextStore =
  createContext<ChangeIndicatorTrackerContextStoreType>(null)

/** @internal */
export const ChangeIndicatorTrackerContextGetSnapshot =
  createContext<ChangeIndicatorTrackerGetSnapshotType>(null)
