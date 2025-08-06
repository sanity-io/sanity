import {useMemo} from 'react'
import {encodeJsonParams} from 'sanity/router'

import {useMediaLibraryIds} from './useMediaLibraryIds'
import {useSanityMediaLibraryConfig} from './useSanityMediaLibraryConfig'

export function usePluginFrameUrl(path: string, params: Record<string, any>) {
  const pluginConfig = useSanityMediaLibraryConfig()
  const mediaLibraryIds = useMediaLibraryIds()
  const appHost = pluginConfig.__internal.hosts.app
  const appBasePath = pluginConfig.__internal.appBasePath

  return useMemo(() => {
    const encodedParams = encodeJsonParams(params)

    return `${appHost}${appBasePath}/${mediaLibraryIds?.organizationId}/${mediaLibraryIds?.libraryId}${path}?createPluginView=${encodedParams}`
  }, [
    mediaLibraryIds?.libraryId,
    mediaLibraryIds?.organizationId,
    path,
    params,
    appHost,
    appBasePath,
  ])
}
