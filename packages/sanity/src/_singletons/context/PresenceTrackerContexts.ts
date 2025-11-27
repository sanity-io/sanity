import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {
  PresenceTrackerContextStoreType,
  PresenceTrackerGetSnapshotType,
} from '../../core/presence/overlay/PresenceTrackerContexts'

/** @internal */
export const PresenceTrackerContextStore: Context<PresenceTrackerContextStoreType> =
  createContext<PresenceTrackerContextStoreType>(
    'sanity/_singletons/context/presence-tracker-store',
    null,
  )

/** @internal */
export const PresenceTrackerContextGetSnapshot: Context<PresenceTrackerGetSnapshotType> =
  createContext<PresenceTrackerGetSnapshotType>(
    'sanity/_singletons/context/presence-tracker-get-snapshot',
    null,
  )
