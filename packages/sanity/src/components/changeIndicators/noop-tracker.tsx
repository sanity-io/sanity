import React from 'react'
import {Reported} from '../react-track-elements'

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
function noop() {}

function NoopTracker({children}: {children: React.ReactNode}) {
  return <>{children}</>
}
export function createNoopTracker<T>() {
  return {
    useReportedValues: noop as () => Reported<T>[],
    Tracker: NoopTracker,
    useReporter: noop as (id: string | null, value: T | (() => T)) => void,
  }
}
