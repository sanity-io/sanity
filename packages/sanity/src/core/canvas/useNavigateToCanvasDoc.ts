import {type Bridge} from '@sanity/message-protocol'
import {useCallback} from 'react'

import {useClient} from '../hooks/useClient'
import {useComlinkStore} from '../store/_legacy/datastores'
import {useProjectOrganizationId} from '../store/_legacy/project/useProjectOrganizationId'
import {useRenderingContext} from '../store/renderingContext/useRenderingContext'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

/**
 *
 * @hidden
 * @internal
 */
export const useNavigateToCanvasDoc = (companionDocId: string | undefined) => {
  const {value: organizationId} = useProjectOrganizationId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {node} = useComlinkStore()
  const renderingContext = useRenderingContext()
  const isInDashboard = renderingContext?.name === 'coreUi'

  const navigateToCanvas = useCallback(() => {
    if (!organizationId || !companionDocId) {
      return
    }
    // If comlink is connected send the message, otherwise open the url in a new tab
    if (isInDashboard && node) {
      const message: Bridge.Navigation.NavigateToResourceMessage = {
        type: 'dashboard/v1/bridge/navigate-to-resource',
        data: {
          resourceId: '',
          resourceType: 'canvas',
          path: `doc/${companionDocId}`,
        },
      }

      node.post(message.type, message.data)
    } else {
      const isStaging = client.config().apiHost === 'https://api.sanity.work'

      window.open(
        `https://www.sanity.${isStaging ? 'work' : 'io'}/@${organizationId}/canvas/doc/${companionDocId}`,
        '_blank',
      )
    }
  }, [organizationId, companionDocId, node, client, isInDashboard])

  return navigateToCanvas
}
