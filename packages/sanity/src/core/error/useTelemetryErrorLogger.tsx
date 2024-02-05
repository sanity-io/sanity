import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'
import {isProd} from '../environment'
import {ErrorLoggerCatch} from './__telemetry__/error.telemetry'

export function useTelemetryErrorLogger(): {
  logErrorToTelemetry: (error: Error) => void
} {
  const telemetry = useTelemetry()

  const logErrorToTelemetry = useCallback(
    (error: Error) => {
      // Track errors produced in production only
      if (isProd) {
        telemetry.log(ErrorLoggerCatch, {
          stack: error.stack,
          message: error.message,
        })
      }
    },
    [telemetry],
  )
  return {logErrorToTelemetry}
}
