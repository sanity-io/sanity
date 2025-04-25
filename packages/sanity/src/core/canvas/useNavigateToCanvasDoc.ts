import {useCallback} from 'react'

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

  const navigateToCanvas = useCallback(() => {
    if (!organizationId || !companionDocId) {
      return
    }
    // TODO: Use comlink when available
    const isStaging = client.config().apiHost === 'https://api.sanity.work'

    window.open(
      `https://www.sanity.${isStaging ? 'work' : 'io'}/@${organizationId}/canvas/doc/${companionDocId}`,
      '_blank',
    )
  }, [companionDocId, organizationId, client])

  return navigateToCanvas
}
