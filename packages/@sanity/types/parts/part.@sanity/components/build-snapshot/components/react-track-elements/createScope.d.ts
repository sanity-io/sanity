import type React from 'react'
import {IsEqualFunction} from './createUseReporter'
import {Reported} from './index'
export declare function createScope<Value>(): {
  Tracker: (props: {children: React.ReactNode}) => JSX.Element
  useReportedValues: () => Reported<Value>[]
  useReporter: import('./createUseReporter').ReporterHook<Value>
  useAutoIdReporter: (value: Value | (() => Value), isEqual?: IsEqualFunction<Value>) => void
}
