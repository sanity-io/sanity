import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {createAppIdCache} from '../create/studio-app/appIdCache'
import {useStudioAppIdStore} from '../create/studio-app/useStudioAppIdStore'
import {useRenderingContextStore} from '../store/_legacy/datastores'
import {useProjectOrganizationId} from '../store/_legacy/project/useProjectOrganizationId'
import {useActiveWorkspace} from '../studio'

interface UseStudioUrlReturn {
  isCoreUi: boolean
  studioUrl: string
}

export const useStudioUrl = (defaultUrl?: string): UseStudioUrlReturn => {
  const renderingContextStore = useRenderingContextStore()
  const renderingContext = useObservable(renderingContextStore.renderingContext)

  const [appIdCache] = useState(() => createAppIdCache())
  const {studioApp, loading: appIdLoading} = useStudioAppIdStore(appIdCache, {
    enabled: true,
  })
  const {activeWorkspace} = useActiveWorkspace()
  const {value: organizationId, loading: organizationIdLoading} = useProjectOrganizationId()

  const isLoading = appIdLoading || organizationIdLoading

  const studioUrl = useMemo(() => {
    console.log({
      renderingContext,
    })
    if (renderingContext?.name !== 'coreUi' || isLoading || !studioApp?.appId) {
      return defaultUrl || window.location.toString()
    }

    return `https://www.sanity.io/@${organizationId}/studio/${studioApp.appId}/${activeWorkspace.name}`
  }, [
    activeWorkspace.name,
    defaultUrl,
    isLoading,
    organizationId,
    renderingContext,
    studioApp?.appId,
  ])

  return {
    isCoreUi: renderingContext?.name === 'coreUi',
    studioUrl,
  }
}
