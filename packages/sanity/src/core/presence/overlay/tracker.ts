import {createTrackerScope, Reported} from '../../components/react-track-elements'
import {FieldPresenceData} from '../types'

export type ReportedPresenceData = Reported<FieldPresenceData>

const {Tracker, useReporter, useReportedValues} = createTrackerScope<FieldPresenceData>()

export {Tracker, useReporter, useReportedValues}
