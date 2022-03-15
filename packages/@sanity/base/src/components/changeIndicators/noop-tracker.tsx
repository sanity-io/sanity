import React from 'react'
import {IsEqualFunction} from '../react-track-elements/createUseReporter'
import {Reported} from './tracker'

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
function noop() {}

function NoopTracker({children}: {children: React.ReactNode}) {
  return <>{children}</>
}
export function createNoopTracker<T>() {
  return {
    useReportedValues: noop as () => Reported<T>[],
    Tracker: NoopTracker,
    useReporter: noop as (
      id: string | null,
      value: T | (() => T),
      isEqual: IsEqualFunction<T>
    ) => void,
  }
}
