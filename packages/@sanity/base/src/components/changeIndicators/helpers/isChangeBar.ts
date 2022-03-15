import {Reported} from '../../react-track-elements'
import {TrackedArea, TrackedChange} from '../tracker'

export function isChangeBar(
  v: Reported<TrackedArea | TrackedChange>
): v is Reported<TrackedChange> {
  return v[0] !== 'changePanel'
}
