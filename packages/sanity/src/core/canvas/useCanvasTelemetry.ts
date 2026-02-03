import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

import {
  CanvasLinkCtaClicked,
  CanvasLinkDialogDiffsShown,
  CanvasLinkDialogRejected,
  type CanvasLinkOrigin,
  CanvasLinkRedirected,
  CanvasOpened,
  CanvasUnlinkApproved,
  CanvasUnlinkCtaClicked,
  type DiffTypesCount,
  type OpenCanvasOrigin,
} from './__telemetry__/canvas.telemetry'
import {type CanvasDiff} from './types'

interface CanvasTelemetryHookValue {
  linkCtaClicked: () => void
  linkRedirected: (origin: CanvasLinkOrigin, diffs?: CanvasDiff[]) => void
  linkDialogDiffsShown: () => void
  linkDialogRejected: (diffs: CanvasDiff[]) => void
  unlinkCtaClicked: () => void
  unlinkApproved: () => void
  canvasOpened: (origin: OpenCanvasOrigin) => void
}
const getDiffTypesCount = (diffs: CanvasDiff[]): DiffTypesCount => {
  return diffs.reduce((acc, diff) => {
    acc[diff.type] = (acc[diff.type] || 0) + 1
    return acc
  }, {} as DiffTypesCount)
}
/** @internal */
export function useCanvasTelemetry(): CanvasTelemetryHookValue {
  const telemetry = useTelemetry()

  return useMemo(
    (): CanvasTelemetryHookValue => ({
      linkCtaClicked: () => telemetry.log(CanvasLinkCtaClicked),
      linkRedirected: (origin, diffs) =>
        telemetry.log(CanvasLinkRedirected, {
          origin,
          diffs: diffs ? getDiffTypesCount(diffs) : undefined,
        }),
      linkDialogDiffsShown: () => telemetry.log(CanvasLinkDialogDiffsShown),
      linkDialogRejected: (diffs) =>
        telemetry.log(CanvasLinkDialogRejected, {diffs: getDiffTypesCount(diffs)}),
      unlinkCtaClicked: () => telemetry.log(CanvasUnlinkCtaClicked),
      unlinkApproved: () => telemetry.log(CanvasUnlinkApproved),
      canvasOpened: (origin) => telemetry.log(CanvasOpened, {origin}),
    }),
    [telemetry],
  )
}
