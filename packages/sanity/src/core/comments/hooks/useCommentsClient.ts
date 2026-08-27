import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useProjectOrganizationId} from '../../store/project/useProjectOrganizationId'
import {useWorkspace} from '../../studio/workspace'

interface UseCommentsClientOptions {
  dataset?: string | null
  loading?: boolean
}

/**
 * Studio client scoped to the Comments API. Returns `client: null` while the
 * organization id is loading, or if organization / project / dataset is missing.
 *
 * The Comments API resolves its resource scope from the client's `projectId`
 * and `dataset`, so `dataset` must be set explicitly: field comments use the
 * workspace dataset (default), task comments the addon dataset.
 *
 * @internal
 */
export function useCommentsClient(options: UseCommentsClientOptions = {}) {
  const {projectId, dataset: workspaceDataset} = useWorkspace()
  const studioClient = useClient({apiVersion: 'vX'})
  const {value: organizationId, loading: organizationLoading} = useProjectOrganizationId()

  const dataset = options.dataset === undefined ? workspaceDataset : options.dataset

  const client = useMemo(() => {
    if (!organizationId || !projectId || !dataset) {
      return null
    }

    return studioClient.withConfig({
      collaboration: {organizationId},
      dataset,
    })
  }, [studioClient, organizationId, projectId, dataset])

  return {client, loading: organizationLoading || Boolean(options.loading)}
}
