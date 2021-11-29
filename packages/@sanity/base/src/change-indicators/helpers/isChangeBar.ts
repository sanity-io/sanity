import type {Reported} from '../../components/react-track-elements'
import type {TrackedArea, TrackedChange} from '../tracker'

export function isChangeBar(
  v: Reported<TrackedArea | TrackedChange>
): v is Reported<TrackedChange> {
  return v[0] !== 'changePanel'
}
