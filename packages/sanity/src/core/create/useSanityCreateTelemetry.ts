import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  CreateDocumentLinkAccepted,
  CreateDocumentLinkCtaClicked,
  CreateDocumentOpened,
  CreateDocumentUnlinkApproved,
  CreateDocumentUnlinkCtaClicked,
} from './__telemetry__/create.telemetry'

interface SanityCreateTelemetryHookValue {
  linkCtaClicked: () => void
  linkAccepted: () => void
  unlinkCtaClicked: () => void
  unlinkApproved: () => void
  documentOpened: () => void
}

/** @internal */
export function useSanityCreateTelemetry(): SanityCreateTelemetryHookValue {
  const telemetry = useTelemetry()

  const startInCreateClicked = useCallback(
    () => telemetry.log(CreateDocumentLinkCtaClicked),
    [telemetry],
  )
  const startInCreateAccepted = useCallback(
    () => telemetry.log(CreateDocumentLinkAccepted),
    [telemetry],
  )
  const unlinkClicked = useCallback(
    () => telemetry.log(CreateDocumentUnlinkCtaClicked),
    [telemetry],
  )
  const unlinkAccepted = useCallback(() => telemetry.log(CreateDocumentUnlinkApproved), [telemetry])
  const editInCreateClicked = useCallback(() => telemetry.log(CreateDocumentOpened), [telemetry])

  return useMemo(
    (): SanityCreateTelemetryHookValue => ({
      linkCtaClicked: startInCreateClicked,
      linkAccepted: startInCreateAccepted,
      unlinkCtaClicked: unlinkClicked,
      unlinkApproved: unlinkAccepted,
      documentOpened: editInCreateClicked,
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
