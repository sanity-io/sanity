/// <reference types="react" />
import {createScope} from './createScope'
export {createScope}
declare const Tracker: (props: {children: import('react').ReactNode}) => JSX.Element,
  useReporter: import('./createUseReporter').ReporterHook<unknown>,
  useReportedValues: () => Reported<unknown>[]
export {Tracker, useReporter, useReportedValues}
export declare type Reported<Value> = [string, Value]
