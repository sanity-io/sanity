import {type Bridge} from '@sanity/message-protocol'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'

import {useClient} from '../hooks/useClient'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {useComlinkStore} from '../store/_legacy/datastores'
import {useProjectOrganizationId} from '../store/_legacy/project/useProjectOrganizationId'
import {useRenderingContext} from '../store/renderingContext/useRenderingContext'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {type OpenCanvasOrigin} from './__telemetry__/canvas.telemetry'
import {canvasLocaleNamespace} from './i18n'
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
  const {value: organizationId} = useProjectOrganizationId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {node} = useComlinkStore()
  const renderingContext = useRenderingContext()
  const isInDashboard = renderingContext?.name === 'coreUi'
  const {canvasOpened} = useCanvasTelemetry()
  const toast = useToast()
  const {t} = useTranslation(canvasLocaleNamespace)

  const navigateToCanvas = useCallback(() => {
    if (!canvasDocId) {
      return
    }
    canvasOpened(origin)
    // If comlink is connected send the message, otherwise open the url in a new tab
    if (isInDashboard && node) {
      const message: Bridge.Navigation.NavigateToResourceMessage = {
        type: 'dashboard/v1/bridge/navigate-to-resource',
        data: {
          resourceId: '',
          resourceType: 'canvas',
          path: `doc/${canvasDocId}`,
        },
      }

      node.post(message.type, message.data)
    } else {
      if (!organizationId) {
        toast.push({
          status: 'error',
          title: t('navigate-to-canvas-doc.error.missing-permissions'),
        })
        return
      }
      const isStaging = client.config().apiHost === 'https://api.sanity.work'

      window.open(
        `https://www.sanity.${isStaging ? 'work' : 'io'}/@${organizationId}/canvas/doc/${canvasDocId}`,
        '_blank',
      )
    }
  }, [canvasDocId, canvasOpened, origin, isInDashboard, node, organizationId, client, toast, t])

  return navigateToCanvas
}
