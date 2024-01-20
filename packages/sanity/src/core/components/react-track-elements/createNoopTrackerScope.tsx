import {type ReactNode} from 'react'

import {type Reported} from './types'

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
function noop() {}

function NoopTracker({children}: {children: ReactNode}) {
  return <>{children}</>
}

/** @internal */
export function createNoopTrackerScope<T>() {
  return {
    useReportedValues: noop as () => Reported<T>[],
    Tracker: NoopTracker,
    useReporter: noop as (id: string | null, value: T | (() => T)) => void,
  }
}
