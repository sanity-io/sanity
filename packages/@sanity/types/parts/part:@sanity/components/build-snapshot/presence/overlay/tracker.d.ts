/// <reference types="react" />
import {Reported} from '../../components/react-track-elements'
import {FieldPresenceData} from '../types'
export declare type ReportedPresenceData = Reported<FieldPresenceData>
declare const Tracker: (props: {children: import('react').ReactNode}) => JSX.Element,
  useReporter: import('../../components/react-track-elements/createUseReporter').ReporterHook<FieldPresenceData>,
  useReportedValues: () => Reported<FieldPresenceData>[]
export {Tracker, useReporter, useReportedValues}
