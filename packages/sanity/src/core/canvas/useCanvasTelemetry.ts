import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

import {
  CanvasLinkCtaClicked,
  CanvasLinkDialogDiffsShown,
  CanvasLinkDialogRejected,
  CanvasLinkRedirected,
  type CanvasLinkRedirectOrigin,
  CanvasOpened,
  CanvasUnlinkApproved,
  CanvasUnlinkCtaClicked,
  type OpenCanvasOrigin,
} from './__telemetry__/canvas.telemetry'

interface CanvasTelemetryHookValue {
  linkCtaClicked: () => void
  linkRedirected: (origin: CanvasLinkRedirectOrigin) => void
  linkDialogDiffsShown: () => void
  linkDialogRejected: () => void
  unlinkCtaClicked: () => void
  unlinkApproved: () => void
  canvasOpened: (origin: OpenCanvasOrigin) => void
}

/** @internal */
export function useCanvasTelemetry(): CanvasTelemetryHookValue {
  const telemetry = useTelemetry()

  return useMemo(
    (): CanvasTelemetryHookValue => ({
      linkCtaClicked: () => telemetry.log(CanvasLinkCtaClicked),
      linkRedirected: (origin) => telemetry.log(CanvasLinkRedirected, {origin}),
      linkDialogDiffsShown: () => telemetry.log(CanvasLinkDialogDiffsShown),
      linkDialogRejected: () => telemetry.log(CanvasLinkDialogRejected),
      unlinkCtaClicked: () => telemetry.log(CanvasUnlinkCtaClicked),
      unlinkApproved: () => telemetry.log(CanvasUnlinkApproved),
      canvasOpened: (origin) => telemetry.log(CanvasOpened, {origin}),
    }),
    [telemetry],
  )
}
