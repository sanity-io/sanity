import {type Reported} from '../../components/react-track-elements/types'
import {type TrackedArea, type TrackedChange} from '../types'

export function isChangeBar(
  v: Reported<TrackedArea | TrackedChange>,
): v is Reported<TrackedChange> {
  return v[0] !== 'changePanel'
}
