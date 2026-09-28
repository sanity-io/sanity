import {useCallback} from 'react'

import {type OpenCanvasOrigin} from './__telemetry__/canvas.telemetry'
import {useCanvasNavigate} from './useCanvasNavigate'
import {useCanvasTelemetry} from './useCanvasTelemetry'

/**
 *
 * @hidden
 * @internal
 */
export const useNavigateToCanvasDoc = (
  canvasDocId: string | undefined,
  origin: OpenCanvasOrigin,
) => {
  const {openCanvas} = useCanvasNavigate()
  const {canvasOpened} = useCanvasTelemetry()

  const navigateToCanvas = useCallback(() => {
    if (!canvasDocId) {
      return
    }
    canvasOpened(origin)
    openCanvas(`doc/${canvasDocId}`)
  }, [canvasDocId, canvasOpened, openCanvas, origin])

  return navigateToCanvas
}
