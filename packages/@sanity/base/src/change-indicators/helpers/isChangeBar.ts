import {Reported} from '../../components/react-track-elements'
import {TrackedArea, TrackedChange} from '../tracker'

const isChangeBar = (v: Reported<TrackedArea | TrackedChange>): v is Reported<TrackedChange> => {
  return v[0] !== 'changePanel'
}

export default isChangeBar
