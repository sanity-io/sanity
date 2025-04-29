import {type Bridge, SDK_CHANNEL_NAME, SDK_NODE_NAME} from '@sanity/message-protocol'
import {type ComlinkStatus, useWindowConnection} from '@sanity/sdk-react'
import {useCallback, useState} from 'react'

import {useClient} from '../hooks/useClient'
import {useProjectOrganizationId} from '../store/_legacy/project/useProjectOrganizationId'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

/**
 *
 * @hidden
 * @internal
 */
export const useNavigateToCanvasDoc = (companionDocId: string | undefined) => {
  const {value: organizationId} = useProjectOrganizationId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [status, setStatus] = useState<ComlinkStatus>('idle')

  const {sendMessage} = useWindowConnection<Bridge.Navigation.NavigateToResourceMessage, never>({
    name: SDK_NODE_NAME,
    connectTo: SDK_CHANNEL_NAME,
    onStatus: setStatus,
  })

  const navigateToCanvas = useCallback(() => {
    if (!organizationId || !companionDocId) {
      return
    }
    // If comlink is connected send the message, otherwise open the url in a new tab
    if (status === 'connected') {
      const message: Bridge.Navigation.NavigateToResourceMessage = {
        type: 'dashboard/v1/bridge/navigate-to-resource',
        data: {
          resourceId: '',
          resourceType: 'canvas',
          path: `doc/${companionDocId}`,
        },
      }

      sendMessage(message.type, message.data)
    } else {
      const isStaging = client.config().apiHost === 'https://api.sanity.work'

      window.open(
        `https://www.sanity.${isStaging ? 'work' : 'io'}/@${organizationId}/canvas/doc/${companionDocId}`,
        '_blank',
      )
    }
  }, [organizationId, companionDocId, status, sendMessage, client])

  return navigateToCanvas
}
