import {createScope, Reported} from '../../components/react-track-elements'
import {FieldPresenceData} from '../types'
export type ReportedPresenceData = Reported<FieldPresenceData>

const {Tracker, useReporter, useReportedValues} = createScope<FieldPresenceData>()

export {Tracker, useReporter, useReportedValues}
