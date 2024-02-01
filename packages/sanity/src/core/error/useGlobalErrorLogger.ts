import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'
import {isProd} from '../environment'
import {PortableTextEditorError} from '../form/__telemetry__/form.telemetry'
import {ErrorLoggerCatch} from './__telemetry__/error.telemetry'

const REPORT_GLOBAL_ERRORS = true

export function useGlobalErrorLogger(): {
  logErrorToTelemetry: (error: Error) => void
} {
  const telemetry = useTelemetry()

  const logErrorToTelemetry = useCallback(
    (error: Error) => {
      // Track errors produced in production
      if (isProd) {
        const isPortableTextEditorError =
          // Error generated inside PTE library. See PortableTextEditorError packages/@sanity/portable-text-editor/src/editor/hooks/useCallbackWithTryCatch.ts
          error.name === 'PortableTextEditorError' ||
          error.stack?.includes('@sanity/portable-text-editor')

        if (isPortableTextEditorError) {
          telemetry.log(PortableTextEditorError, {
            error: error,
            message: error.message,
            stack: error.stack,
          })
        } else if (REPORT_GLOBAL_ERRORS) {
          telemetry.log(ErrorLoggerCatch, {
            error: error,
            stack: error.stack,
          })
        }
      }
    },
    [telemetry],
  )
  return {logErrorToTelemetry}
}
