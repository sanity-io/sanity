import type React from 'react'
import {Reported} from './tracker'
import {IsEqualFunction} from '../components/react-track-elements/createUseReporter'
declare function NoopTracker({children}: {children: React.ReactNode}): JSX.Element
export declare function createNoopTracker<T>(): {
  useReportedValues: () => Reported<T>[]
  Tracker: typeof NoopTracker
  useReporter: (id: string, value: T | (() => T), isEqual: IsEqualFunction<T>) => void
}
export {}
