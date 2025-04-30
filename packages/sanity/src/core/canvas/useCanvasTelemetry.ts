import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

import {
  CanvasLinkCtaClicked,
  CanvasLinkDialogDiffsShown,
  CanvasLinkDialogRejected,
  CanvasLinkRedirected,
  type CanvasLinkRedirectOptions,
  CanvasOpened,
  CanvasUnlinkApproved,
  CanvasUnlinkCtaClicked,
  type OpenCanvasOrigin,
} from './__telemetry__/canvas.telemetry'
import {type CanvasDiff} from './types'

interface CanvasTelemetryHookValue {
  linkCtaClicked: () => void
  linkRedirected: (options: CanvasLinkRedirectOptions) => void
  linkDialogDiffsShown: () => void
  linkDialogRejected: (diffs: CanvasDiff[]) => void
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
      linkRedirected: (options) => telemetry.log(CanvasLinkRedirected, options),
      linkDialogDiffsShown: () => telemetry.log(CanvasLinkDialogDiffsShown),
      linkDialogRejected: (diffs: CanvasDiff[]) => telemetry.log(CanvasLinkDialogRejected, {diffs}),
      unlinkCtaClicked: () => telemetry.log(CanvasUnlinkCtaClicked),
      unlinkApproved: () => telemetry.log(CanvasUnlinkApproved),
      canvasOpened: (origin) => telemetry.log(CanvasOpened, {origin}),
    }),
    [telemetry],
  )
}
