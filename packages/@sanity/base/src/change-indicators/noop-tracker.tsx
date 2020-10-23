import React from 'react'
import {Reported} from './tracker'
import {IsEqualFunction} from '../components/react-track-elements/createUseReporter'

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

function NoopTracker({children}: {children: React.ReactNode}) {
  return <>{children}</>
}
export function createNoopTracker<T>() {
  return {
    useReportedValues: noop as () => Reported<T>[],
    Tracker: NoopTracker,
    useReporter: noop as (id: string, value: T | (() => T), isEqual: IsEqualFunction<T>) => void,
  }
}
