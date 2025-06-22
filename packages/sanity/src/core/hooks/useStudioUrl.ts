import {useCallback, useMemo} from 'react'

import {useStudioAppIdStore} from '../create/studio-app/useStudioAppIdStore'
import {useProjectOrganizationId} from '../store/_legacy/project/useProjectOrganizationId'
import {useRenderingContext} from '../store/renderingContext/useRenderingContext'
import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'
import {getDashboardPath} from '../util/dashboardPath'

type StudioUrlBuilder = (url: string) => string
type StudioUrlModifier = {coreUi?: StudioUrlBuilder; studio?: StudioUrlBuilder} & (
  | {coreUi: StudioUrlBuilder}
  | {studio: StudioUrlBuilder}
)

interface UseStudioUrlReturnType {
  studioUrl: string
  buildStudioUrl: (modifiers: StudioUrlModifier) => string
}

/**
 * @internal
 */
export const useStudioUrl = (defaultUrl?: string): UseStudioUrlReturnType => {
  const renderingContext = useRenderingContext()
  const {studioApp, loading: appIdLoading} = useStudioAppIdStore({
    enabled: true,
  })
  const {activeWorkspace} = useActiveWorkspace()
  const {value: organizationId, loading: organizationIdLoading} = useProjectOrganizationId()

  const isLoading = appIdLoading || organizationIdLoading
  const isCoreUi = renderingContext?.name === 'coreUi'

  const studioUrl = useMemo(() => {
    if (!isCoreUi || isLoading || !studioApp?.appId || !organizationId) {
      return defaultUrl || window.location.toString()
    }

    return getDashboardPath({
      organizationId,
      appId: studioApp.appId,
      workspaceName: activeWorkspace.name,
    })
  }, [activeWorkspace.name, defaultUrl, isCoreUi, isLoading, organizationId, studioApp?.appId])

  const buildStudioUrl = useCallback(
    ({coreUi, studio}: StudioUrlModifier) => {
      const urlModifier = isCoreUi ? coreUi : studio

      return urlModifier?.(studioUrl) || studioUrl
    },
    [isCoreUi, studioUrl],
  )

  return {
    buildStudioUrl,
    studioUrl,
  }
}
