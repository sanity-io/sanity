import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  CreateUnlinkAccepted,
  CreateUnlinkClicked,
  EditInCreateClicked,
  StartInCreateAccepted,
  StartInCreateClicked,
} from './__telemetry__/create.telemetry'

interface SanityCreateTelemetryHookValue {
  startInCreateClicked: () => void
  startInCreateAccepted: () => void
  unlinkClicked: () => void
  unlinkAccepted: () => void
  editInCreateClicked: () => void
}

/** @internal */
export function useSanityCreateTelemetry(): SanityCreateTelemetryHookValue {
  const telemetry = useTelemetry()

  const startInCreateClicked = useCallback(() => telemetry.log(StartInCreateClicked), [telemetry])
  const startInCreateAccepted = useCallback(() => telemetry.log(StartInCreateAccepted), [telemetry])
  const unlinkClicked = useCallback(() => telemetry.log(CreateUnlinkClicked), [telemetry])
  const unlinkAccepted = useCallback(() => telemetry.log(CreateUnlinkAccepted), [telemetry])
  const editInCreateClicked = useCallback(() => telemetry.log(EditInCreateClicked), [telemetry])

  return useMemo(
    (): SanityCreateTelemetryHookValue => ({
      startInCreateClicked,
      startInCreateAccepted,
      unlinkClicked,
      unlinkAccepted,
      editInCreateClicked,
    }),
    [
      startInCreateClicked,
      startInCreateAccepted,
      unlinkClicked,
      unlinkAccepted,
      editInCreateClicked,
    ],
  )
}
