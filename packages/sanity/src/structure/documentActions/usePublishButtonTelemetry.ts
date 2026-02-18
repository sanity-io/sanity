import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useRef} from 'react'

import {
  type PublishButtonDisabledReason,
  PublishButtonReadyTrace,
} from './__telemetry__/documentActions.telemetry'

interface UsePublishButtonTelemetryProps {
  isDisabled: boolean
  disabledReasons: PublishButtonDisabledReason[]
}

/**
 * Traces the time from the publish button becoming disabled to becoming enabled again.
 * Purely observational — no side effects on the publish flow.
 */
export function usePublishButtonTelemetry(props: UsePublishButtonTelemetryProps): void {
  const {isDisabled, disabledReasons} = props

  const telemetry = useTelemetry()

  // Time-to-ready trace
  const readyTraceRef = useRef<ReturnType<typeof telemetry.trace> | null>(null)
  const disabledReasonAtRef = useRef<PublishButtonDisabledReason | 'unknown'>('unknown')

  useEffect(() => {
    if (isDisabled) {
      if (readyTraceRef.current === null) {
        const trace = telemetry.trace(PublishButtonReadyTrace)
        trace.start()
        readyTraceRef.current = trace
        disabledReasonAtRef.current = disabledReasons[0] || 'unknown'
      }
    } else {
      if (readyTraceRef.current !== null) {
        readyTraceRef.current.log({
          disabledReason: disabledReasonAtRef.current,
        })
        readyTraceRef.current.complete()
        readyTraceRef.current = null
      }
    }
  }, [isDisabled, disabledReasons, telemetry])
}
