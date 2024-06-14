import {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
} from '../../components/react-track-elements'
import {type FieldPresenceData} from '../types'

/**
 * @internal
 * @hidden
 */
export type PresenceTrackerContextStoreType = TrackerContextStore<FieldPresenceData> | null

/**
 * @internal
 * @hidden
 */
export type PresenceTrackerGetSnapshotType = TrackerContextGetSnapshot<FieldPresenceData> | null
