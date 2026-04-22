import {useCallback, useMemo} from 'react'

import {useProjectOrganizationId} from '../store/project/useProjectOrganizationId'
import {useRenderingContext} from '../store/renderingContext/useRenderingContext'
import {useStudioAppIdStore} from '../store/studio-app/useStudioAppIdStore'
import {useActiveWorkspace} from '../studio'
import {useEnvAwareSanityWebsiteUrl} from '../studio/hooks/useEnvAwareSanityWebsiteUrl'
import {getDashboardPath} from '../util/dashboardPath'

type StudioUrlBuilder = (url: string) => string
type StudioUrlModifier = {coreUi?: StudioUrlBuilder; studio?: StudioUrlBuilder} & (
  | {coreUi: StudioUrlBuilder}
  | {studio: StudioUrlBuilder}
)

interface UseStudioUrlReturnType {
  studioUrl: string
  buildStudioUrl: (modifiers: StudioUrlModifier) => string
  buildIntentUrl: (intentLink: string) => string
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
  const sanityWebsiteUrl = useEnvAwareSanityWebsiteUrl()

  const appId = studioApp?.appId || ''
  const studioUrl = useMemo(() => {
    if (!isCoreUi || isLoading || !appId || !organizationId) {
      return defaultUrl || window.location.origin
    }

    return getDashboardPath({
      dashboardDomain: sanityWebsiteUrl,
      organizationId,
      appId: appId,
      workspaceName: activeWorkspace.name,
    })
  }, [
    activeWorkspace.name,
    defaultUrl,
    isCoreUi,
    isLoading,
    organizationId,
    appId,
    sanityWebsiteUrl,
  ])

  const basePath = activeWorkspace.basePath

  const buildStudioUrl = useCallback(
    ({coreUi, studio}: StudioUrlModifier) => {
      const urlModifier = isCoreUi ? coreUi : studio

      return urlModifier?.(studioUrl) || studioUrl
    },
    [isCoreUi, studioUrl],
  )

  const buildIntentUrl = useCallback(
    (intentLink: string) => {
      if (isCoreUi && basePath !== '/') {
        return `${studioUrl}${intentLink.slice(basePath.length)}`
      }
      return `${studioUrl}${intentLink}`
    },
    [basePath, isCoreUi, studioUrl],
  )

  return {
    buildIntentUrl,
    buildStudioUrl,
    studioUrl,
  }
}
