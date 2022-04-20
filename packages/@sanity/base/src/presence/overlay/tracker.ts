import {createScope, Reported} from '../../components'
import {FieldPresenceData} from '../types'
export type ReportedPresenceData = Reported<FieldPresenceData>

const {Tracker, useReporter, useReportedValues} = createScope<FieldPresenceData>()

export {Tracker, useReporter, useReportedValues}
