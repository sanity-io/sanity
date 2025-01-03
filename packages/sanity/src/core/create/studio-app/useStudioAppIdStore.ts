import {useEffect, useMemo, useState} from 'react'

import {useClient} from '../../hooks/useClient'
import {useSource} from '../../studio/source'
import {useSanityCreateConfig} from '../context/useSanityCreateConfig'
import {type AppIdCache, type AppIdFetcher} from './appIdCache'
import {type CompatibleStudioAppId, fetchCreateCompatibleAppId} from './fetchCreateCompatibleAppId'

export interface ResolvedStudioApp {
  loading: boolean
  studioApp?: CompatibleStudioAppId
}

/**
 * Fetches & caches the Studio appId for the current origin.
 *
 * @internal
 */
export function useStudioAppIdStore(cache: AppIdCache): ResolvedStudioApp {
  const client = useClient({apiVersion: '2024-09-01'})
  const config = useSanityCreateConfig()
  const {projectId} = useSource()

  const appIdFetcher: AppIdFetcher = useMemo(() => {
    return (pId) =>
      fetchCreateCompatibleAppId({
        projectId: pId,
        client,
        fallbackOrigin: config.fallbackStudioOrigin,
      })
  }, [client, config.fallbackStudioOrigin])

  return useStudioAppIdStoreInner({
    projectId,
    cache,
    appIdFetcher,
    enabled: config.startInCreateEnabled,
  })
}

export function useStudioAppIdStoreInner(props: {
  cache: AppIdCache
  projectId: string
  enabled: boolean
  appIdFetcher: AppIdFetcher
}): ResolvedStudioApp {
  const {cache, enabled, appIdFetcher, projectId} = props
  const [loading, setLoading] = useState(false)

  const [studioApp, setStudioApp] = useState<CompatibleStudioAppId | undefined>()

  useEffect(() => {
    let mounted = true
    async function getAppId() {
      if (!projectId) {
        return
      }
      setLoading(true)

      try {
        const entry = await cache.get({projectId, appIdFetcher})
        if (mounted) setStudioApp(entry)
      } catch (err) {
        if (mounted) setStudioApp(undefined)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (enabled) {
      getAppId().catch(console.error)
    }
    return () => {
      mounted = false
      setLoading(false)
    }
  }, [setLoading, appIdFetcher, cache, enabled, projectId])

  return {
    loading,
    studioApp,
  }
}
