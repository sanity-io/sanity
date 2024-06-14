import {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
} from '../components/react-track-elements'
import {type ChangeIndicatorTrackerContextValue} from './types'

/**
 * @internal
 * @hidden
 */
export type ChangeIndicatorTrackerContextStoreType =
  TrackerContextStore<ChangeIndicatorTrackerContextValue> | null

/**
 * @internal
 * @hidden
 */
export type ChangeIndicatorTrackerGetSnapshotType =
  TrackerContextGetSnapshot<ChangeIndicatorTrackerContextValue> | null
