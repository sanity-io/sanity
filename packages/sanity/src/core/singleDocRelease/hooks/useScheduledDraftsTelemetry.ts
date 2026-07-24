import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  ScheduledDraftCancelled,
  ScheduledDraftCreated,
  ScheduledDraftRescheduled,
} from '../__telemetry__/scheduledDrafts.telemetry'

interface ScheduledDraftsTelemetryHookValue {
  scheduledDraftCreated: (documentType: string) => void
  scheduledDraftRescheduled: (fromPaused: boolean) => void
  scheduledDraftCancelled: (keptAsDraft: boolean) => void
}

/** @internal */
export function useScheduledDraftsTelemetry(): ScheduledDraftsTelemetryHookValue {
  const telemetry = useTelemetry()

  const scheduledDraftCreated = useCallback(
    (documentType: string) => {
      telemetry.log(ScheduledDraftCreated, {documentType})
    },
    [telemetry],
  )

  const scheduledDraftRescheduled = useCallback(
    (fromPaused: boolean) => {
      telemetry.log(ScheduledDraftRescheduled, {fromPaused})
    },
    [telemetry],
  )

  const scheduledDraftCancelled = useCallback(
    (keptAsDraft: boolean) => {
      telemetry.log(ScheduledDraftCancelled, {keptAsDraft})
    },
    [telemetry],
  )

  return useMemo(
    (): ScheduledDraftsTelemetryHookValue => ({
      scheduledDraftCreated,
      scheduledDraftRescheduled,
      scheduledDraftCancelled,
    }),
    [scheduledDraftCreated, scheduledDraftRescheduled, scheduledDraftCancelled],
  )
}
