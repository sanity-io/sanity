import type {
  PresenceTrackerContextStoreType,
  PresenceTrackerGetSnapshotType,
} from '../../core/presence/overlay/PresenceTrackerContexts'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const PresenceTrackerContextStore = createContext<PresenceTrackerContextStoreType>(
  'sanity/_singletons/context/presence-tracker-store',
  null,
)

/** @internal */
export const PresenceTrackerContextGetSnapshot = createContext<PresenceTrackerGetSnapshotType>(
  'sanity/_singletons/context/presence-tracker-get-snapshot',
  null,
)
