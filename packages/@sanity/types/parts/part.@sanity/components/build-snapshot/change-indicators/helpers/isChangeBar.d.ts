import {Reported} from '../../components/react-track-elements'
import {TrackedArea, TrackedChange} from '../tracker'
declare const isChangeBar: (
  v: Reported<TrackedChange | TrackedArea>
) => v is Reported<TrackedChange>
export default isChangeBar
