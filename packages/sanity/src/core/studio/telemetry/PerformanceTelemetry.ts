// Tracks performance metrics from the field
import {type PropsWithChildren} from 'react'

import {useMeasurePerformanceTelemetry} from './useMeasurePerformanceTelemetry'

/**
 * @internal
 */
export function PerformanceTelemetryTracker(props: PropsWithChildren) : React.JSX.Element {
  useMeasurePerformanceTelemetry()
  return props.children
}
