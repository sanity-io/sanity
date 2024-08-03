import {createContext} from 'react'

import type {
  PresenceTrackerContextStoreType,
  PresenceTrackerGetSnapshotType,
} from '../../../../core/presence/overlay/PresenceTrackerContexts'

/** @internal */
export const PresenceTrackerContextStore = createContext<PresenceTrackerContextStoreType>(null)

/** @internal */
export const PresenceTrackerContextGetSnapshot = createContext<PresenceTrackerGetSnapshotType>(null)
