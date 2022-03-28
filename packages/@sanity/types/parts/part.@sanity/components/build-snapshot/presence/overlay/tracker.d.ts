import type {ReactNode} from 'react'
import type {Reported} from '../../components/react-track-elements'
import type {FieldPresenceData} from '../types'
export declare type ReportedPresenceData = Reported<FieldPresenceData>
declare const Tracker: (props: {children: ReactNode}) => JSX.Element,
  useReporter: import('../../components/react-track-elements/createUseReporter').ReporterHook<FieldPresenceData>,
  useReportedValues: () => Reported<FieldPresenceData>[]
export {Tracker, useReporter, useReportedValues}
