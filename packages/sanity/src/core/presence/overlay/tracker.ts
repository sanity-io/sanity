import {createTrackerScope, type Reported} from '../../components/react-track-elements'
import {type FieldPresenceData} from '../types'

export type ReportedPresenceData = Reported<FieldPresenceData>

const {Tracker, useReporter, useReportedValues} = createTrackerScope<FieldPresenceData>()

export {Tracker, useReportedValues, useReporter}
