import type {Reported} from '../../components/react-track-elements'
import {createScope} from '../../components/react-track-elements'
import type {FieldPresenceData} from '../types'
export type ReportedPresenceData = Reported<FieldPresenceData>

const {Tracker, useReporter, useReportedValues} = createScope<FieldPresenceData>()

export {Tracker, useReporter, useReportedValues}
