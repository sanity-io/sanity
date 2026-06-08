import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

import {
  CanvasLinkCtaClicked,
  CanvasLinkDialogDiffsShown,
  CanvasLinkDialogRejected,
  type CanvasLinkRedirectedTrigger,
  CanvasLinkRedirected,
  CanvasOpened,
  type CanvasOpenedLocation,
  CanvasUnlinkApproved,
  CanvasUnlinkCtaClicked,
  type DiffTypesCount,
} from './__telemetry__/canvas.telemetry'
import {type CanvasDiff} from './types'

interface CanvasTelemetryHookValue {
  linkCtaClicked: () => void
  linkRedirected: (trigger: CanvasLinkRedirectedTrigger, diffs?: CanvasDiff[]) => void
  linkDialogDiffsShown: () => void
  linkDialogRejected: (diffs: CanvasDiff[]) => void
  unlinkCtaClicked: () => void
  unlinkApproved: () => void
  canvasOpened: (location: CanvasOpenedLocation) => void
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
      linkRedirected: (trigger, diffs) =>
        telemetry.log(CanvasLinkRedirected, {
          trigger,
          diffs: diffs ? getDiffTypesCount(diffs) : undefined,
        }),
      linkDialogDiffsShown: () => telemetry.log(CanvasLinkDialogDiffsShown),
      linkDialogRejected: (diffs) =>
        telemetry.log(CanvasLinkDialogRejected, {diffs: getDiffTypesCount(diffs)}),
      unlinkCtaClicked: () => telemetry.log(CanvasUnlinkCtaClicked),
      unlinkApproved: () => telemetry.log(CanvasUnlinkApproved),
      canvasOpened: (location) => telemetry.log(CanvasOpened, {location, source: 'studio'}),
    }),
    [telemetry],
  )
}
