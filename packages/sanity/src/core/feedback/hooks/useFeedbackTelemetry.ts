import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {FeedbackDialogDismissed, FeedbackDialogOpened} from '../__telemetry__/feedback.telemetry'

interface FeedbackTelemetryHookValue {
  feedbackDialogOpened: () => void
  feedbackDialogDismissed: () => void
}

/** @internal */
export function useFeedbackTelemetry(): FeedbackTelemetryHookValue {
  const telemetry = useTelemetry()

  const feedbackDialogOpened = useCallback(() => {
    telemetry.log(FeedbackDialogOpened)
  }, [telemetry])

  const feedbackDialogDismissed = useCallback(() => {
    telemetry.log(FeedbackDialogDismissed)
  }, [telemetry])

  return useMemo(
    () => ({feedbackDialogOpened, feedbackDialogDismissed}),
    [feedbackDialogOpened, feedbackDialogDismissed],
  )
}
